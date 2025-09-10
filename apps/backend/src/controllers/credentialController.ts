import {Response} from "express";
import CredentialModel from "../models/Credentials";
import { authRequest } from "../utils/authMiddleware";

export const createCredential = async (req : authRequest, res : Response) => {
    try{
        const {title, platform, data} = req.body;

        const credential = await CredentialModel.create({
            title,
            platform,
            data,
            userId : req.user?.userId
        });

        res.status(201).json({credential});
    }catch(err){
        res.status(500).json({ message : "Error creating credential", error : err});
    }
};

export const getAllCredentials = async (req : authRequest, res : Response) => {
    try{
        const credentials = await CredentialModel.find({ userId : req.user?.userId});
        res.json({credentials});
    }catch(err){
         res.status(500).json({ message : "Error fetching credential", error : err});
    }
}

export const deleteCredential = async (req : authRequest, res : Response) => {
    try{
        const credential = await CredentialModel.findOneAndDelete({
            _id : req.params.id,
            userId : req.user?.userId
        });

        if(!credential){
            return res.status(404).json({ message : "Credential not found"});
        }

        res.json({ message : "Credential deleted successfully"});
    }catch(err){
        res.status(500).json({ message : "Error deleting the credential", error : err});
    }
};