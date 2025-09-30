import axios from "axios";
import { DynamicTool } from "@langchain/core/tools";
import { executeWorkflow } from "./executionService";

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


export async function createToolFromNode(node: any, context: any) {
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
        description: `Execute another workflow to perform complex tasks. Use this tool when you need to run a different workflow that contains multiple steps or specialized logic. Pass data as JSON or simple text.`,
        func: async (input: string) => {
          return await executeWorkflowTool(node, input, context);
        }
      });
    
    default:
      throw new Error(`Unknown tool type: ${node.type}`);
  }
}


export async function executeHttpTool(node: any, input: string, context: any) {
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

export async function executeCodeTool(node: any, input: string, context: any): Promise<ExecResult> {
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

  const postUrl = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true';
  const getUrlBase = 'https://judge0-ce.p.rapidapi.com/submissions';

  try {
    // First try one-shot request with wait=true
    const postResp = await axios.post(
      postUrl,
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
        timeout: 20000,
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
      await new Promise((r) => setTimeout(r, 1000 + attempts * 500));

      const res = await axios.get(`${getUrlBase}/${token}?base64_encoded=false`, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        timeout: 15000,
      });

      result = res.data;
      if (result && result.status && result.status.id >= 3) {
        break;
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
    const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
    throw new Error(`Code execution failed: ${msg}`);
  }
}

export async function executeWorkflowTool(node: any, input: string, context: any) {
  const { workflowId, triggerData } = node.data || {};
  
  if (!workflowId) {
    throw new Error("No workflow ID configured in workflow tool");
  }

  try {
    let parsedTriggerData = triggerData || {};
    if (input && typeof input === 'string') {
      try {
        parsedTriggerData = { ...parsedTriggerData, ...JSON.parse(input) };
      } catch {
        parsedTriggerData = { ...parsedTriggerData, message: input };
      }
    }

    const result = await executeWorkflow(workflowId, parsedTriggerData);
    
    return JSON.stringify({
      success: result.success,
      executionId: result.executionId,
      results: result.results,
      message: `Workflow executed successfully with ${result.results.length} nodes`
    });

  } catch (error: any) {
    throw new Error(`Workflow execution failed: ${error.message}`);
  }
}