import { Response } from "express";
import { Types } from "mongoose";
import workFlowModel from "../models/WorkFlow";
import { authRequest } from "../utils/authMiddleware";
import { syncWebhooksForWorkflow } from "../utils/webhookSync";

export const createWorkflow = async (req: authRequest, res: Response) => {
  try {
    const { title, nodes, connections, enabled } = req.body;

    const workflow = await workFlowModel.create({
      title,
      nodes,
      connections,
      enabled: enabled ?? true,
      userId: req.user?.userId,
    });

    await syncWebhooksForWorkflow(workflow._id as Types.ObjectId, nodes || []);

    res.status(201).json({ workflow, message: "workflow created" });
  } catch (err) {
    res.status(500).json({ message: "Error creating workflow", error: err });
  }
};

export const getWorkflows = async (req: authRequest, res: Response) => {
  try {
    const workflows = await workFlowModel.find({ userId: req.user?.userId });
    res.json({ workflows });
  } catch (err) {
    res.status(500).json({ message: "Error fetching workflows", error: err });
  }
};

export const getWorkflowById = async (req: authRequest, res: Response) => {
  try {
    const workflow = await workFlowModel.findOne({
      _id: req.params.id,
      userId: req.user?.userId,
    });

    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    res.json({ workflow });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching the workflow", error: err });
  }
};

export const updateWorkflow = async (req: authRequest, res: Response) => {
  try {
    const workflow = await workFlowModel.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user?.userId,
      },
      req.body,
      { new: true }
    );

    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    if (req.body.nodes) {
      await syncWebhooksForWorkflow(
        workflow._id as Types.ObjectId,
        req.body.nodes
      );
    }

    res.json({ workflow });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating the workflow", error: err });
  }
};

export const deleteWorkflow = async (req: authRequest, res: Response) => {
  try {
    const workflow = await workFlowModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?.userId,
    });

    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    res.json({ message: "Workflow deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting workflow", error: err });
  }
};
