import { Router } from "express";
import { authMiddleware } from "../utils/authMiddleware";
import { createWorkflow, getWorkflows, getWorkflowById, updateWorkflow, deleteWorkflow } from "../controllers/workflowController";

const router : Router = Router();

router.post("/", authMiddleware, createWorkflow);
router.get("/", authMiddleware, getWorkflows);
router.get("/:id", authMiddleware, getWorkflowById);
router.put("/:id", authMiddleware, updateWorkflow);
router.delete("/:id", authMiddleware, deleteWorkflow);

export default router;
