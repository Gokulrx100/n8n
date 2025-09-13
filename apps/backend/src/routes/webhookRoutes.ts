import { Router } from "express";
import { createWebhook, getWebhooks, getWebhookById, updateWebhook, deleteWebhook } from "../controllers/webhookController";
import { authMiddleware } from "../utils/authMiddleware";

const router : Router = Router();

router.post("/", authMiddleware, createWebhook);
router.get("/", authMiddleware, getWebhooks);
router.get("/:id", authMiddleware, getWebhookById);
router.put("/:id", authMiddleware, updateWebhook);
router.delete("/:id", authMiddleware, deleteWebhook);

export default router;
