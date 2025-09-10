import { Schema, model, Document } from "mongoose";

export interface ICredential extends Document {
  title: string;
  platform: string;
  data: Record<string, any>;
  userId : Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CredentialSchema = new Schema<ICredential>(
  {
    title: { type: String, required: true },
    platform: { type: String, required: true },
    data: { type: Object, required: true },
    userId : {type : Schema.Types.ObjectId, ref : "User", required : true}
  },
  { timestamps: true }
);

const CredentialModel = model<ICredential>("Credential", CredentialSchema);
export default CredentialModel;
