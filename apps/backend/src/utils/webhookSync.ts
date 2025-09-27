import { v4 as uuidv4 } from "uuid";
import WebhookModel, { IWebhook } from "../models/Webhook";
import { Types } from "mongoose";

type NodeLike = {
  id: string;
  type: string;
  data?: Record<string, any>;
};

export async function syncWebhooksForWorkflow(
  workflowId: Types.ObjectId,
  nodes: NodeLike[]
) {
  const webhookNodes = nodes.filter((n) => n.type === "webhookTrigger");
  const referencedWebhookIds: string[] = [];

  for (const node of webhookNodes) {
    const data = node.data || {};
    const existingWebhookId = data.webhookId;
    
    // Skip if no path provided
    if (!data.path) {
      console.warn(`Skipping webhook node ${node.id} - no path provided`);
      continue;
    }
    
    const webhookData = {
      title: data.title || `Webhook for node ${node.id}`,
      workflowId,
      nodeId: node.id,
      method: (data.method || "POST").toUpperCase(),
      path: data.path,
      header: data.header || {},
      secret: data.secret || undefined,
    };

    let webhook: IWebhook;

    if (existingWebhookId) {
      const existingWebhook = await WebhookModel.findByIdAndUpdate(
        existingWebhookId,
        webhookData,
        { new: true }
      );
      
      if (existingWebhook && existingWebhook.workflowId.toString() === workflowId.toString()) {
        webhook = existingWebhook;
      } else {
        webhook = await WebhookModel.create(webhookData);
      }
    } else {
      const existingWebhook = await WebhookModel.findOne({
        path: data.path,
        workflowId: workflowId
      });
      
      if (existingWebhook) {
        const updatedWebhook = await WebhookModel.findByIdAndUpdate(
          existingWebhook._id,
          webhookData,
          { new: true }
        );
        webhook = updatedWebhook || existingWebhook;
      } else {
        webhook = await WebhookModel.create(webhookData);
      }
    }

    referencedWebhookIds.push(webhook._id.toString());
    node.data = { ...node.data, webhookId: webhook._id.toString(), path: webhook.path };
  }

  await WebhookModel.deleteMany({
    workflowId,
    _id: { $nin: referencedWebhookIds },
  });

  return { nodes, referencedWebhookIds };
}
