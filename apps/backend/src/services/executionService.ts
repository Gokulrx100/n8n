import { Types } from "mongoose";
import workFlowModel, { IWorkFlow } from "../models/WorkFlow";
import CredentialModel, { ICredential } from "../models/Credentials";
import * as nodemailer from 'nodemailer';
import axios from "axios";

interface ExecutionResult {
  executionId: string;
  success: boolean;
  results: NodeExecutionResult[];
}

interface NodeExecutionResult {
  nodeId: string;
  nodeType: string;
  success: boolean;
  data: any;
  error?: string;
}

export async function executeWorkflow(workflowId: Types.ObjectId, triggerData: any = {}): Promise<ExecutionResult> {
  const workflow = await workFlowModel.findById(workflowId);
  if (!workflow || !workflow.enabled) {
    throw new Error("Workflow not found or disabled");
  }

  const triggerNode = workflow.nodes.find(node => 
    node.type === 'manualTrigger' || node.type === 'webhookTrigger'
  );

  if (!triggerNode) {
    throw new Error("No trigger node found");
  }

  const executionId = `exec_${Date.now()}`;
  const results: NodeExecutionResult[] = [];
  const context = { 
    triggerData, 
    nodeOutputs: {} as Record<string, any> 
  };

  try {
    await executeNodeSequence(triggerNode, workflow, context, results);

    return {
      executionId,
      success: true,
      results
    };
  } catch (error) {
    console.error("Workflow execution failed:", error);
    return {
      executionId,
      success: false,
      results: [{
        nodeId: triggerNode.id,
        nodeType: triggerNode.type,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]
    };
  }
}

async function executeNodeSequence(
  currentNode: any, 
  workflow: IWorkFlow, 
  context: any, 
  results: NodeExecutionResult[]
) {
  const executed = new Set<string>();
  let nodeToExecute = currentNode;

  while (nodeToExecute) {
    if (executed.has(nodeToExecute.id)) {
      break;
    }

    const nodeResult = await executeNode(nodeToExecute, context);
    
    results.push({
      nodeId: nodeToExecute.id,
      nodeType: nodeToExecute.type,
      success: nodeResult.success,
      data: nodeResult.data,
      error: nodeResult.error
    });

    context.nodeOutputs[nodeToExecute.id] = nodeResult.data;
    executed.add(nodeToExecute.id);

    if (!nodeResult.success) {
      break;
    }

    nodeToExecute = getNextNode(nodeToExecute.id, workflow);
  }
}

function getNextNode(currentNodeId: string, workflow: IWorkFlow) {
  const connections = workflow.connections || [];
  const nextConnection = connections.find((conn: any) => conn.source === currentNodeId);
  if (!nextConnection) {
    return null; 
  }
  return workflow.nodes.find(node => node.id === nextConnection.target) || null;
}

async function executeNode(node: any, context: any): Promise<{ success: boolean; data: any; error?: string }> {
  console.log(`Executing: ${node.id} (${node.type})`);
  
  try {
    switch (node.type) {
      case 'manualTrigger':
        return {
          success: true,
          data: {
            message: "Manual trigger executed",
            payload: context.triggerData,
            timestamp: new Date().toISOString()
          }
        };

      case 'webhookTrigger':
        return {
          success: true,
          data: {
            message: "Webhook trigger executed", 
            payload: context.triggerData,
            timestamp: new Date().toISOString()
          }
        };

      case 'emailAction':
        return await executeEmailAction(node, context);

      case 'telegramAction':
        return await executeTelegramAction(node, context);

      default:
        console.warn(`Unknown node type: ${node.type}`);
        return {
          success: true,
          data: { message: `${node.type} executed (not implemented)` }
        };
    }
  } catch (error) {
    console.error(`Node execution failed: ${node.id}`, error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function executeEmailAction(node: any, context: any) {
  const { credentialId, to, subject, body } = node.data || {};
  
  if (!credentialId) {
    throw new Error("No email credential selected");
  }

  const credential: ICredential | null = await CredentialModel.findById(credentialId);
  if (!credential || credential.platform !== 'email') {
    throw new Error("Email credential not found");
  }

  const { email: fromEmail, appPassword } = credential.data;
  if (!fromEmail || !appPassword) {
    throw new Error("Email credential missing email or app password");
  }

  const recipient = to || context.triggerData?.email || context.triggerData?.body?.email;
    
  if (!recipient) {
    throw new Error("No recipient email specified. Please provide 'to' field in email node or include 'email' in trigger payload");
  }

  const finalSubject = subject || context.triggerData?.subject || context.triggerData?.body?.subject;
  const finalBody = body || context.triggerData?.message || context.triggerData?.body?.message;
  
  const processedSubject = processTemplate(finalSubject, context);
  const processedBody = processTemplate(finalBody, context);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: fromEmail,
      pass: appPassword
    }
  });

  const mailOptions = {
    from: fromEmail,
    to: recipient,
    subject: processedSubject,
    html: processedBody.replace(/\n/g, '<br>'),
    text: processedBody 
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      data: {
        message: "Email sent successfully",
        messageId: info.messageId,
        from: fromEmail,
        to: recipient,
        subject: processedSubject,
        sentAt: new Date().toISOString()
      }
    };
  } catch (error: any) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

async function executeTelegramAction(node: any, context: any) {
  const { credentialId, chatId, message } = node.data || {};
  
  if (!credentialId) {
    throw new Error("No Telegram credential selected");
  }

  const credential: ICredential | null = await CredentialModel.findById(credentialId);
  if (!credential || credential.platform !== 'telegram') {
    throw new Error("Telegram credential not found");
  }

  const { botToken } = credential.data;
  if (!botToken) {
    throw new Error("Bot token not configured in credential");
  }

  const targetChatId = chatId || context.triggerData?.chatId || context.triggerData?.body?.chatId;
    
  if (!targetChatId) {
    throw new Error("No chat ID specified. Please provide 'chatId' field in telegram node or include 'chatId' in trigger payload");
  }

  const finalMessage = message || context.triggerData?.message || context.triggerData?.body?.message;
  const processedMessage = processTemplate(finalMessage, context);

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  try {
    const response = await axios.post(telegramApiUrl, {
      chat_id: targetChatId,
      text: processedMessage,
      parse_mode: 'HTML' 
    });

    const result = response.data;

    if (!result.ok) {
      throw new Error(result.description || 'Failed to send Telegram message');
    }

    return {
      success: true,
      data: {
        message: "Telegram message sent successfully",
        messageId: result.result.message_id,
        chatId: targetChatId,
        text: processedMessage,
        sentAt: new Date().toISOString()
      }
    };

  } catch (error: any) {
    if (error.response) {
      const errorMsg = error.response.data?.description || error.response.statusText || 'Telegram API error';
      throw new Error(`Telegram send failed: ${errorMsg}`);
    }
    throw new Error(`Telegram send failed: ${error.message || 'Unknown error'}`);
  }
}

function processTemplate(template: string, context: any): string {
  if (!template) return '';
  
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const cleanPath = path.trim();
    
    if (context.triggerData?.[cleanPath]) {
      return context.triggerData[cleanPath].toString();
    }
    
    const [nodeId, field] = cleanPath.split('.');
    if (nodeId && field && context.nodeOutputs?.[nodeId]) {
      return context.nodeOutputs[nodeId]?.[field]?.toString() || match;
    }
    return match;
  });
}