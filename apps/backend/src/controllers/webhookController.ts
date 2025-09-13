import { Request, Response } from "express";
import webHookModel from "../models/Webhook";
import { authRequest } from "../utils/authMiddleware";


export const createWebhook = async (req: authRequest, res: Response) => {
  try {
    const { title, workflowId, nodeId, method, path, header, secret } =
      req.body;

    const webhook = await webHookModel.create({
      title,
      workflowId,
      nodeId,
      method,
      path,
      header,
      secret,
    });
    res.status(201).json({ webhook });
  } catch (err) {
    res.status(500).json({ message: "Error creating webhook", error: err });
  }
};

export const getWebhooks = async (req: authRequest, res: Response) => {
  try {
    const webhooks = await webHookModel
      .find()
      .populate({
        path: "workflowId",
        match: { userId: req.user?.userId },
        select: "_id title",
      })
      .lean();

    const filtered = webhooks.filter((w) => w.workflowId !== null);
    res.json({ webhooks: filtered });
  } catch (err) {
    res.status(500).json({ message: "Error fetching webhooks", error: err });
  }
};

export const getWebhookById = async (req: authRequest, res: Response) => {
  try {
    const webhook = await webHookModel
      .findById(req.params.id)
      .populate("workflowId", "userId title");

    if (
      !webhook ||
      !webhook.workflowId ||
      typeof webhook.workflowId !== "object" ||
      (webhook.workflowId as any).userId?.toString() !== req.user?.userId
    ) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    res.json({ webhook });
  } catch (err) {
    res.status(500).json({ message: "Error fetching webhook", error: err });
  }
};

export const updateWebhook = async (req: authRequest, res: Response) => {
  try {
    const webhook = await webHookModel
      .findById(req.params.id)
      .populate("workflowId", "userId");

    if (
      !webhook ||
      !webhook.workflowId ||
      typeof webhook.workflowId !== "object" ||
      !(webhook.workflowId as any).userId ||
      (webhook.workflowId as any).userId.toString() !== req.user?.userId
    ) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    Object.assign(webhook, req.body);
    await webhook.save();

    res.json({ webhook });
  } catch (err) {
    res.status(500).json({ message: "Error updating webhook", error: err });
  }
};

export const deleteWebhook = async (req: authRequest, res: Response) => {
  try {
    const webhook = await webHookModel
      .findById(req.params.id)
      .populate("workflowId", "userId");

    if (
      !webhook ||
      !webhook.workflowId ||
      typeof webhook.workflowId !== "object" ||
      !(webhook.workflowId as any).userId ||
      (webhook.workflowId as any).userId.toString() !== req.user?.userId
    ) {
      return res.status(404).json({ message: "Webhook not found" });
    }

    await webhook.deleteOne();
    res.json({ message: "Webhook deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting webhook", error: err });
  }
};
