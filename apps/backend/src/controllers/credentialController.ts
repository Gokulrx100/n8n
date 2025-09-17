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

export const editCredential = async (req : authRequest, res : Response) => {
    try{
        const { id } = req.params;
    const { title, platform, data } = req.body;
    
    const existingCredential = await CredentialModel.findById(id);
    if (!existingCredential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    const updatedData = { ...existingCredential.data };
    
    if (platform === 'telegram' && data.botToken) {
      updatedData.botToken = data.botToken;
    } else if (platform === 'email') {
      if (data.email) updatedData.email = data.email;
      if (data.appPassword) updatedData.appPassword = data.appPassword;
    }

    const updatedCredential = await CredentialModel.findByIdAndUpdate(
      id,
      { title, platform, data: updatedData },
      { new: true }
    );

    res.json({ credential: updatedCredential });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update credential' });
  }
}