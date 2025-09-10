import { Schema, model, Document } from "mongoose";

export interface Iwebhook extends Document {
  title: string;
  method: string;
  path: string;
  header?: Record<string, string>;
  secret?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema = new Schema<Iwebhook>(
  {
    title: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    header: { type: Schema.Types.Mixed },
    secret: { type: String },
  },
  { timestamps: true }
);

const WebhookModel = model<Iwebhook>("Webhook", WebhookSchema);
export default WebhookModel;
