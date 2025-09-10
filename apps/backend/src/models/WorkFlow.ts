import {Schema, model, Document} from "mongoose";

export interface IWorkFlow extends Document{
    title : string;
    enabled : boolean;
    nodes : any[];
    connections : Record<string, any>;
    createdAt: Date;
    updatedAt : Date;
}

const workFlowSchema = new Schema<IWorkFlow>({
    title : {type : String, required : true},
    enabled : {type : Boolean, default : true},
    nodes : [{ type: Schema.Types.Mixed, required: true }],
    connections : {type : Schema.Types.Mixed, required : true},
}, {timestamps : true});

const workFlowModel = model<IWorkFlow>("WorkFlow", workFlowSchema);
export default workFlowModel;


