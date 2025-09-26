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
    const method = (data.method || "POST").toUpperCase();
    let path = data.path || `wh_${uuidv4()}`;

    if (existingWebhookId) {
      const w: IWebhook | null = await WebhookModel.findById(existingWebhookId);
      if (w && w.workflowId.toString() === workflowId.toString()) {
        w.method = method;
        w.path = path;
        w.header = data.header || w.header;
        w.secret = data.secret || w.secret;
        await w.save();
        referencedWebhookIds.push(w._id.toString());
        node.data = { ...node.data, webhookId: w._id.toString(), path };
        continue;
      }
    }

    const created: IWebhook = await WebhookModel.create({
      title: data.title || `Webhook for node ${node.id}`,
      workflowId,
      nodeId: node.id,
      method,
      path,
      header: data.header || {},
      secret: data.secret || undefined,
    });

    referencedWebhookIds.push(created._id.toString());
    node.data = { ...node.data, webhookId: created._id.toString(), path };
  }

  await WebhookModel.deleteMany({
    workflowId,
    _id: { $nin: referencedWebhookIds },
  });

  return { nodes, referencedWebhookIds };
}
