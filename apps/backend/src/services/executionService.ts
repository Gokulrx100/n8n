import { Types } from "mongoose";
import workFlowModel, { IWorkFlow } from "../models/WorkFlow";
import CredentialModel, { ICredential } from "../models/Credentials";
import { Resend } from 'resend';
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

  // Find trigger node (starting point)
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

  // Execute nodes starting from trigger, following connections
  await executeNodeSequence(triggerNode, workflow, context, results);

  return {
    executionId,
    success: true,
    results
  };
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
    // Avoid infinite loops
    if (executed.has(nodeToExecute.id)) {
      break;
    }

    // Execute current node
    const nodeResult = await executeNode(nodeToExecute, context);
    
    results.push({
      nodeId: nodeToExecute.id,
      nodeType: nodeToExecute.type,
      success: nodeResult.success,
      data: nodeResult.data,
      error: nodeResult.error
    });

    // Store output for template variables
    context.nodeOutputs[nodeToExecute.id] = nodeResult.data;
    executed.add(nodeToExecute.id);

    // If execution failed, stop the workflow
    if (!nodeResult.success) {
      break;
    }

    // Find next connected node
    nodeToExecute = getNextNode(nodeToExecute.id, workflow);
  }
}

function getNextNode(currentNodeId: string, workflow: IWorkFlow) {
  const connections = workflow.connections || [];
  
  // Find the first connection from current node
  const nextConnection = connections.find((conn: any) => conn.source === currentNodeId);
  if (!nextConnection) {
    return null; // End of workflow
  }

  // Find the target node
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
            payload: node.data?.payload || context.triggerData,
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

      // Easy to add new node types here
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
  
  // For MVP: Use default configuration regardless of credential selection
  // TODO: Later implement per-user API keys and verified domains
  const resendApiKey = process.env.RESEND_API_KEY!;
  const defaultFromEmail = process.env.DEFAULT_FROM_EMAIL!;
  
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY not configured in environment");
  }

  //  validate credential exists (for future compatibility)
  if (credentialId) {
    const credential: ICredential | null = await CredentialModel.findById(credentialId);
    if (!credential || credential.platform !== 'email') {
      throw new Error("Email credential not found");
    }
    // Note: We're not using the credential data yet, but validating it exists
  }

  const resend = new Resend(resendApiKey);

  // Determine recipient
  const recipient = to || context.triggerData?.email || context.triggerData?.to;
  if (!recipient) {
    throw new Error("No recipient email specified");
  }

  const processedSubject = processTemplate(subject || 'Notification from Workflow', context);
  const processedBody = processTemplate(body || 'Hello from your workflow!', context);

  const { data, error } = await resend.emails.send({
    from: defaultFromEmail,
    to: [recipient],
    subject: processedSubject,
    html: processedBody.replace(/\n/g, '<br>')
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return {
    success: true,
    data: {
      message: "Email sent successfully",
      emailId: data?.id,
      from: defaultFromEmail,
      to: recipient,
      subject: processedSubject,
      sentAt: new Date().toISOString()
    }
  };
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

  // Determine chat ID (can come from node config, trigger data, or previous node output)
  const targetChatId = chatId || context.triggerData?.chatId || context.triggerData?.chat_id;
  if (!targetChatId) {
    throw new Error("No chat ID specified");
  }

  // Process template variables in message
  const processedMessage = processTemplate(message || 'Hello from your workflow!', context);

  // Send message via Telegram Bot API using axios
  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  try {
    const response = await axios.post(telegramApiUrl, {
      chat_id: targetChatId,
      text: processedMessage,
      parse_mode: 'HTML' // Allow HTML formatting
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
    // Handle axios errors
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
    
    // Handle trigger variables: {{trigger.email}}
    if (cleanPath.startsWith('trigger.')) {
      const key = cleanPath.replace('trigger.', '');
      return context.triggerData?.[key]?.toString() || match;
    }
    
    // Handle node output variables: {{nodeId.field}}
    const [nodeId, field] = cleanPath.split('.');
    if (nodeId && field) {
      return context.nodeOutputs?.[nodeId]?.[field]?.toString() || match;
    }
    
    return match;
  });
}