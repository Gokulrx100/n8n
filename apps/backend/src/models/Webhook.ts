import { Schema, model, Document, Types } from "mongoose";

export interface IWebhook extends Document {
  title: string;
  workflowId: Types.ObjectId;    
  nodeId: string;                
  method: string;
  path: string;
  header?: Record<string, string>;
  secret?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema = new Schema<IWebhook>(
  {
    title: { type: String, required: true },
    workflowId: { type: Schema.Types.ObjectId, ref: "WorkFlow", required: true },
    nodeId: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true, unique: true },
    header: { type: Schema.Types.Mixed },
    secret: { type: String },
  },
  { timestamps: true }
);

const webHookModel = model<IWebhook>("Webhook", WebhookSchema);
export default webHookModel;