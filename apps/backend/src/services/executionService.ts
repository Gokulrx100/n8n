import { Types } from "mongoose";
import workFlowModel, { IWorkFlow } from "../models/WorkFlow";
import { executeEmailAction, executeTelegramAction } from "./nodeExecutors";
import { executeAIAgent } from "./aiAgentService";

interface NodeExecutionResult {
  nodeId: string;
  nodeType: string;
  success: boolean;
  data: any;
  error?: string;
}

interface ExecutionResult {
  executionId: string;
  success: boolean;
  results: NodeExecutionResult[];
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

export function getConnectedNodes(currentNodeId: string, workflow: IWorkFlow, direction: 'from' | 'to' = 'from') {
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

export function processTemplate(template: string, context: any): string {
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
