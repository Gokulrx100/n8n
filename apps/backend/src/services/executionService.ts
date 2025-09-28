import { Types } from "mongoose";
import workFlowModel, { IWorkFlow } from "../models/WorkFlow";
import CredentialModel, { ICredential } from "../models/Credentials";
import * as nodemailer from "nodemailer";
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

export async function executeWorkflow(
  workflowId: Types.ObjectId,
  triggerData: any = {}
): Promise<ExecutionResult> {
  const workflow = await workFlowModel.findById(workflowId);
  if (!workflow || !workflow.enabled) {
    throw new Error("Workflow not found or disabled");
  }

  const triggerNode = workflow.nodes.find(
    (node) => node.type === "manualTrigger" || node.type === "webhookTrigger"
  );

  if (!triggerNode) {
    throw new Error("No trigger node found");
  }

  const executionId = `exec_${Date.now()}`;
  const results: NodeExecutionResult[] = [];
  const context = {
    triggerData,
    nodeOutputs: {} as Record<string, any>,
  };

  try {
    await executeNodeSequence(triggerNode, workflow, context, results);

    const hasFailures = results.some((result) => !result.success);
    return {
      executionId,
      success: !hasFailures,
      results,
    };
    
  } catch (error) {
    console.error("Workflow execution failed:", error);
    return {
      executionId,
      success: false,
      results: [
        {
          nodeId: triggerNode.id,
          nodeType: triggerNode.type,
          success: false,
          data: null,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      ],
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
  const queue = [currentNode];

  while (queue.length > 0) {
    const currentBatch = [...queue];
    queue.length = 0;
    const batchPromises = currentBatch.map(async (nodeToExecute) => {
      if (executed.has(nodeToExecute.id)) {
        return;
      }

      const nodeResult = await executeNode(nodeToExecute, context);

      results.push({
        nodeId: nodeToExecute.id,
        nodeType: nodeToExecute.type,
        success: nodeResult.success,
        data: nodeResult.data,
        error: nodeResult.error,
      });

      context.nodeOutputs[nodeToExecute.id] = nodeResult.data;
      executed.add(nodeToExecute.id);

      if (nodeResult.success) {
        const connectedNodes = getConnectedNodes(nodeToExecute.id, workflow);
        connectedNodes.forEach((node: any) => {
          if (
            !executed.has(node.id) &&
            !queue.some((q: any) => q.id === node.id)
          ) {
            queue.push(node);
          }
        });
      }
    });

    await Promise.all(batchPromises);
  }
}

function getConnectedNodes(currentNodeId: string, workflow: IWorkFlow) {
  const connections = workflow.connections || [];
  const connectedConnections = connections.filter(
    (conn: any) => conn.source === currentNodeId
  );

  return connectedConnections
    .map((conn: any) => {
      return workflow.nodes.find((node: any) => node.id === conn.target);
    })
    .filter((node: any) => {
      return node !== undefined;
    });
}

async function executeNode(
  node: any,
  context: any
): Promise<{ success: boolean; data: any; error?: string }> {
  console.log(`Executing: ${node.type} (${node.id})`);

  try {
    switch (node.type) {
      case "manualTrigger":
        return {
          success: true,
          data: {
            message: "Manual trigger executed",
            payload: context.triggerData,
            timestamp: new Date().toISOString(),
          },
        };

      case "webhookTrigger":
        return {
          success: true,
          data: {
            message: "Webhook trigger executed",
            payload: context.triggerData,
            timestamp: new Date().toISOString(),
          },
        };

      case "emailAction":
        return await executeEmailAction(node, context);

      case "telegramAction":
        return await executeTelegramAction(node, context);

      case "aiAgent":
        return await executeAiAgent(node, context);

      case "httpTool":
        return await executeHttpTool(node, context);

      default:
        console.warn(`Unknown node type: ${node.type}`);
        return {
          success: true,
          data: { message: `${node.type} executed (not implemented)` },
        };
    }
  } catch (error) {
    console.error(`Node execution failed: ${node.id}`, error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function executeEmailAction(node: any, context: any) {
  const { credentialId, to, subject, body } = node.data || {};

  if (!credentialId) {
    throw new Error("No email credential selected");
  }

  const credential: ICredential | null =
    await CredentialModel.findById(credentialId);
  if (!credential || credential.platform !== "email") {
    throw new Error("Email credential not found");
  }

  const { email: fromEmail, appPassword } = credential.data;
  if (!fromEmail || !appPassword) {
    throw new Error("Email credential missing email or app password");
  }

  const RawRecipient =
    to || context.triggerData?.email || context.triggerData?.body?.email;
  const RawSubject =
    subject ||
    context.triggerData?.subject ||
    context.triggerData?.body?.subject;
  const RawBody =
    body || context.triggerData?.message || context.triggerData?.body?.message;

  const processedRecipient = processTemplate(RawRecipient, context);
  const processedSubject = processTemplate(RawSubject, context);
  const processedBody = processTemplate(RawBody, context);

  if (!processedRecipient) {
    throw new Error("No recipient defined");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: fromEmail,
      pass: appPassword,
    },
  });

  const mailOptions = {
    from: fromEmail,
    to: processedRecipient,
    subject: processedSubject,
    html: processedBody.replace(/\n/g, "<br>"),
    text: processedBody,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      data: {
        message: "Email sent successfully",
        messageId: info.messageId,
        from: fromEmail,
        to: processedRecipient,
        subject: processedSubject,
        sentAt: new Date().toISOString(),
      },
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

  const credential: ICredential | null =
    await CredentialModel.findById(credentialId);
  if (!credential || credential.platform !== "telegram") {
    throw new Error("Telegram credential not found");
  }

  const { botToken } = credential.data;
  if (!botToken) {
    throw new Error("Bot token not configured in credential");
  }

  const RawChatId =
    chatId || context.triggerData?.chatId || context.triggerData?.body?.chatId;
  const RawMessage =
    message ||
    context.triggerData?.message ||
    context.triggerData?.body?.message;
  const processedChatId = processTemplate(RawChatId, context);
  const processedMessage = processTemplate(RawMessage, context);

  if (!processedChatId) {
    throw new Error("No chat ID specified");
  }

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await axios.post(telegramApiUrl, {
      chat_id: processedChatId,
      text: processedMessage,
      parse_mode: "HTML",
    });

    const result = response.data;

    if (!result.ok) {
      throw new Error(result.description || "Failed to send Telegram message");
    }

    return {
      success: true,
      data: {
        message: "Telegram message sent successfully",
        messageId: result.result.message_id,
        chatId: processedChatId,
        text: processedMessage,
        sentAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    if (error.response) {
      const errorMsg =
        error.response.data?.description ||
        error.response.statusText ||
        "Telegram API error";
      throw new Error(`Telegram send failed: ${errorMsg}`);
    }
    throw new Error(
      `Telegram send failed: ${error.message || "Unknown error"}`
    );
  }
}

async function executeAiAgent(node: any, context: any) {
  const { systemPrompt } = node.data || {};

  if (!systemPrompt) {
    throw new Error("System prompt required for AI Agent");
  }

  return {
    success: true,
    data: {
      message: "AI Agent executed successfully",
      output: "This is a placeholder response",
      executedAt: new Date().toISOString(),
    },
  };
}

async function executeHttpTool(node: any, context: any) {
  const { url, method } = node.data || {};

  if (!url) {
    throw new Error("URL is required for HTTP Tool");
  }

  try {
    const response = await axios({
      method: method.toUpperCase(),
      url: url,
    });

    return {
      success: true,
      data: {
        message: "HTTP request executed successfully",
        status: response.status,
        data: response.data,
        executedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    throw new Error(`HTTP request failed: ${error.message}`);
  }
}

function processTemplate(template: string, context: any): string {
  if (!template) return "";

  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const cleanPath = path.trim();

    if (context.triggerData?.[cleanPath]) {
      return context.triggerData[cleanPath].toString();
    }

    if (context.triggerData?.body?.[cleanPath]) {
      return context.triggerData.body[cleanPath].toString();
    }

    const [nodeId, field] = cleanPath.split(".");
    if (nodeId && field && context.nodeOutputs?.[nodeId]) {
      return context.nodeOutputs[nodeId]?.[field]?.toString() || match;
    }
    return match;
  });
}
