import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { DynamicTool } from "@langchain/core/tools";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BASE_SYSTEM_PROMPT } from "./systemPromptBase";
import { getMemory, saveMessage } from "./memoryService";
import { createToolFromNode } from "./toolExecutors";
import { processTemplate } from "./executionService";


export function findConnectedToolNodes(aiAgentNode: any, workflow: any) {
  const connectedNodes = getConnectedNodes(aiAgentNode.id, workflow, 'to');
  return connectedNodes.filter((node: any) => 
    ['httpTool', 'codeTool', 'workflowTool'].includes(node.type)
  );
}


export function findConnectedModelNode(aiAgentNode: any, workflow: any) {
  const connectedNodes = getConnectedNodes(aiAgentNode.id, workflow, 'to');
  return connectedNodes.find((node: any) => node.type === 'geminiModel');
}

export function findConnectedMemoryNode(aiAgentNode: any, workflow: any) {
  const connectedNodes = getConnectedNodes(aiAgentNode.id, workflow, 'to');
  return connectedNodes.find((node: any) => node.type === 'redisMemory');
}


function getConnectedNodes(currentNodeId: string, workflow: any, direction: 'from' | 'to' = 'from') {
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


export async function executeAIAgent(node: any, context: any) {
  const modelNode = findConnectedModelNode(node, context.workflow);
  if (!modelNode) {
    throw new Error("No Gemini model node connected to AI Agent");
  }

  const { apiKey, model, temperature, maxTokens } = modelNode.data || {};
  if (!apiKey) {
    throw new Error("No API key configured in model node");
  }

  const llm = new ChatGoogleGenerativeAI({
    model: model,
    temperature: temperature || 0,
    maxOutputTokens: maxTokens || 1000,
    apiKey: apiKey,
  });

  const toolNodes = findConnectedToolNodes(node, context.workflow);
  const tools = await Promise.all(
    toolNodes.map((toolNode: any) => createToolFromNode(toolNode, context))
  );

  const memoryNode = findConnectedMemoryNode(node, context.workflow);
  let chatHistory : any[] = [];

  if(memoryNode){
    const {sessionId, maxHistory} = memoryNode.data || {};
    if(sessionId){
      chatHistory = await getMemory(sessionId, maxHistory || 10);
    }
  }
  const processedUserPrompt = processTemplate(node.data.systemPrompt, context);
  
  const finalSystemPrompt = BASE_SYSTEM_PROMPT.replace('{userPrompt}', processedUserPrompt);

  const customPrompt = ChatPromptTemplate.fromMessages([
    ["system", finalSystemPrompt],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]);

  const agent = await createToolCallingAgent({
    llm: llm,
    tools: tools,
    prompt: customPrompt,
  });

  const agentExecutor = new AgentExecutor({
    agent: agent,
    tools: tools,
    verbose: true,
  });

  const input = `Execute the task as specified in the system prompt. Available data: ${JSON.stringify(context.triggerData)}`;

  const result = await agentExecutor.invoke({
    input: input,
    chat_history: chatHistory
  });

  
  if(memoryNode){
    const {sessionId} = memoryNode.data || {};
    if(sessionId){
      await saveMessage(sessionId, {type: "human", content: input});
      await saveMessage(sessionId, {type: "ai", content: result.output});
    }
  }

  return {
    success: true,
    data: {
      message: "AI Agent executed successfully",
      output: result.output,
      toolsUsed: result.intermediateSteps?.length || 0,
      memoryUsed: memoryNode ? true : false,
      timestamp: new Date().toISOString(),
    }
  };
}