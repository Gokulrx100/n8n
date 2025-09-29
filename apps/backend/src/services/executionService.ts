import { Types } from "mongoose";
import workFlowModel, { IWorkFlow } from "../models/WorkFlow";
import CredentialModel, { ICredential } from "../models/Credentials";
import { BASE_SYSTEM_PROMPT } from "./systemPromptBase";
import * as nodemailer from "nodemailer";
import axios from "axios";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { DynamicTool } from "@langchain/core/tools";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";


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

type ExecResult = {
  status: string;
  statusId?: number;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | null;
  memory?: string | null;
  language: string;
};


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
    workflow: workflow
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

function getConnectedNodes(currentNodeId: string, workflow: IWorkFlow, direction: 'from' | 'to' = 'from') {
  const connections = workflow.connections || [];
  const connectedConnections = connections.filter(
    (conn: any) => direction === 'from' 
      ? conn.source === currentNodeId 
      : conn.target === currentNodeId
  );

  return connectedConnections
    .map((conn: any) => {
      return workflow.nodes.find((node: any) => 
        node.id === (direction === 'from' ? conn.target : conn.source)
      );
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
        return await executeAIAgent(node, context);

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


// Helper function to find connected tool nodes
function findConnectedToolNodes(aiAgentNode: any, workflow: any) {
  const connectedNodes = getConnectedNodes(aiAgentNode.id, workflow, 'to');
  return connectedNodes.filter((node: any) => 
    ['httpTool', 'codeTool', 'workflowTool'].includes(node.type)
  );
}

// Helper function to find connected model node
function findConnectedModelNode(aiAgentNode: any, workflow: any) {
  const connectedNodes = getConnectedNodes(aiAgentNode.id, workflow, 'to');
  return connectedNodes.find((node: any) => node.type === 'geminiModel');
}

// Helper function to create tools from connected nodes
async function createToolFromNode(node: any, context: any) {
  switch (node.type) {
    case 'httpTool':
      return new DynamicTool({
        name: `http_${node.id}`,
        description: "Use this tool to fetch data from external APIs, websites, or any internet source. Use for JSON data, API calls, or external information.",
        func: async (input: string) => {
          return await executeHttpTool(node, input, context);
        }
      });
    
      case 'codeTool':
        return new DynamicTool({
          name: `code_${node.id}`,
          description: "Execute code to perform calculations, solve algorithms, or process data. Use this tool when users ask for mathematical operations, code execution, or computational tasks. Automatically use numbers from user requests. This tool supports JavaScript and Python.",
          func: async (input: string) => {
            return await executeCodeTool(node, input, context);
          }
        });
    
    case 'workflowTool':
      return new DynamicTool({
        name: `workflow_${node.id}`,
        description: `Execute another workflow. Use this tool to run a different workflow and get its result.`,
        func: async (input: string) => {
          return await executeWorkflowTool(node, input, context);
        }
      });
    
    default:
      throw new Error(`Unknown tool type: ${node.type}`);
  }
}

// HTTP Tool execution
async function executeHttpTool(node: any, input: string, context: any) {
  const { url, method = 'GET' } = node.data || {};
  
  if (!url) {
    throw new Error("No URL configured in HTTP tool");
  }

  try {
    const response = await axios({
      method: method.toLowerCase(),
      url: url,
      data: method !== 'GET' ? input : undefined,
      params: method === 'GET' ? { query: input } : undefined,
    });

    return JSON.stringify({
      status: response.status,
      data: response.data,
      message: `HTTP ${method} request successful`
    });
  } catch (error: any) {
    throw new Error(`HTTP request failed: ${error.message}`);
  }
}

async function executeCodeTool(node: any, input: string, context: any): Promise<ExecResult> {
  const { language, code } = node.data || {};

  if (!language || !code) {
    throw new Error("No language or code configured in code tool");
  }

  const languageMap: { [key: string]: number } = {
    javascript: 63, // Node.js
    python: 71,     // Python 3
  };

  const languageId = languageMap[language.toLowerCase()];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const apiKey = process.env.JUDGE0_API_KEY;
  if (!apiKey) {
    throw new Error('Judge0 API key not configured in process.env.JUDGE0_API_KEY');
  }

  // Prefer the single-request mode (wait=true). If the instance supports it, no polling needed.
  const postUrl = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true';
  const getUrlBase = 'https://judge0-ce.p.rapidapi.com/submissions';

  try {
    // First try one-shot request with wait=true (simpler)
    const postResp = await axios.post(
      postUrl,
      {
        source_code: code,
        language_id: languageId,
        stdin: input ?? '',
        // cpu_time_limit: 2, memory_limit: 65536
      },
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
        timeout: 20000, // 20s
      }
    );

    if (postResp?.data && (postResp.data.stdout !== undefined || postResp.data.stderr !== undefined || postResp.data.status)) {
      const r = postResp.data;
      return {
        status: r.status?.description ?? 'unknown',
        statusId: r.status?.id,
        stdout: r.stdout ?? null,
        stderr: r.stderr ?? null,
        compile_output: r.compile_output ?? null,
        time: r.time ?? null,
        memory: r.memory ?? null,
        language,
      };
    }

    // If we didn't get final result, fallback to submit + poll
    const submitResp = await axios.post(
      `${getUrlBase}?base64_encoded=false`,
      {
        source_code: code,
        language_id: languageId,
        stdin: input ?? '',
      },
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const token = submitResp.data?.token;
    if (!token) throw new Error('Failed to create submission (no token)');

    // Poll for result
    const maxAttempts = 15;
    let attempts = 0;
    let result: any = null;
    while (attempts < maxAttempts) {
      // small backoff
      await new Promise((r) => setTimeout(r, 1000 + attempts * 500));

      const res = await axios.get(`${getUrlBase}/${token}?base64_encoded=false`, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        timeout: 15000,
      });

      result = res.data;
      // status.id < 3 typically means "in queue" or "processing"
      if (result && result.status && result.status.id >= 3) {
        break; // finished
      }
      attempts++;
    }

    if (!result) throw new Error('No result after polling');

    return {
      status: result.status?.description ?? 'unknown',
      statusId: result.status?.id,
      stdout: result.stdout ?? null,
      stderr: result.stderr ?? null,
      compile_output: result.compile_output ?? null,
      time: result.time ?? null,
      memory: result.memory ?? null,
      language,
    };
  } catch (err: any) {
    // helpful error information
    const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
    throw new Error(`Code execution failed: ${msg}`);
  }
}


// Workflow Tool execution (placeholder)
async function executeWorkflowTool(node: any, input: string, context: any) {
  throw new Error("Workflow tool not implemented yet");
}

// AI Agent execution
async function executeAIAgent(node: any, context: any) {
  // Find connected model node
  const modelNode = findConnectedModelNode(node, context.workflow);
  if (!modelNode) {
    throw new Error("No Gemini model node connected to AI Agent");
  }

  // Get model configuration
  const { apiKey, model, temperature, maxTokens } = modelNode.data || {};
  if (!apiKey) {
    throw new Error("No API key configured in model node");
  }

  // Create the model
  const llm = new ChatGoogleGenerativeAI({
    model: model,
    temperature: temperature || 0,
    maxOutputTokens: maxTokens || 1000,
    apiKey: apiKey,
  });

  // Find connected tool nodes
  const toolNodes = findConnectedToolNodes(node, context.workflow);
  // Create tools from connected nodes
  const tools = await Promise.all(
    toolNodes.map((toolNode: any) => createToolFromNode(toolNode, context))
  );

  // Process the user's system prompt with template variables
  const processedUserPrompt = processTemplate(node.data.systemPrompt, context);
  
  // Combine with base system prompt
  const finalSystemPrompt = BASE_SYSTEM_PROMPT.replace('{userPrompt}', processedUserPrompt);

  const customPrompt = ChatPromptTemplate.fromMessages([
    ["system", finalSystemPrompt],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]);

  // Create agent
  const agent = await createToolCallingAgent({
    llm: llm,
    tools: tools,
    prompt: customPrompt,
  });

  // Create agent executor
  const agentExecutor = new AgentExecutor({
    agent: agent,
    tools: tools,
    verbose: true,
  });

  // Use a generic input since the actual instruction is now in the system prompt
  const input = "Execute the task as specified in the system prompt.";

  // Execute the agent
  const result = await agentExecutor.invoke({
    input: input,
    chat_history: [] // No memory for now
  });

  return {
    success: true,
    data: {
      message: "AI Agent executed successfully",
      output: result.output,
      toolsUsed: result.intermediateSteps?.length || 0,
      timestamp: new Date().toISOString(),
    }
  };
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
