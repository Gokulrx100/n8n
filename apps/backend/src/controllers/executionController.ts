import { Response } from "express";
import { authRequest } from "../utils/authMiddleware";
import { executeWorkflow } from "../services/executionService";
import workFlowModel from "../models/WorkFlow";
import webHookModel from "../models/Webhook";

export const executeWorkflowManually = async (req: authRequest, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { triggerData = {} } = req.body;

    const workflow = await workFlowModel.findOne({
      _id: workflowId,
      userId: req.user?.userId
    });

    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    if (!workflow.enabled) {
      return res.status(400).json({ message: "Workflow is disabled" });
    }

    const result = await executeWorkflow(workflow._id as any, triggerData);
    
    res.json({
      message: "Workflow executed successfully",
      execution: result
    });

  } catch (error) {
    console.error("Manual execution error:", error);
    res.status(500).json({
      message: "Workflow execution failed",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const executeWorkflowViaWebhook = async (req: any, res: Response) => {
  try {
    const { path } = req.params;

    const webhook = await webHookModel.findOne({ path }).populate('workflowId');

    if (!webhook || !webhook.workflowId) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    const workflow = webhook.workflowId as any;
    if (!workflow.enabled) {
      return res.status(400).json({ message: "Workflow is disabled" });
    }

    if (webhook.method.toUpperCase() !== req.method.toUpperCase()) {
      return res.status(405).json({ 
        message: `Method not allowed. Expected ${webhook.method}, got ${req.method}` 
      });
    }

    if (webhook.secret) {
      const providedSecret = req.headers["secret"] || req.query.secret;
      if (providedSecret !== webhook.secret) {
        return res.status(401).json({ message: "Invalid webhook secret" });
      }
    }

    const triggerData = {
      method: req.method,
      path: req.path,
      headers: req.headers,
      query: req.query,
      body: req.body,
      webhookId: webhook._id,
      timestamp: new Date().toISOString()
    };

    const result = await executeWorkflow(workflow._id, triggerData);
    
    res.json({
      message: "Webhook executed successfully",
      execution: result
    });

  } catch (error) {
    console.error("Webhook execution error:", error);
    res.status(500).json({
      message: "Webhook execution failed", 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};