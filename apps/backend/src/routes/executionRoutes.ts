import { Router } from "express";
import { authMiddleware } from "../utils/authMiddleware";
import { executeWorkflowManually, executeWorkflowViaWebhook} from "../controllers/executionController";

const router : Router = Router();

router.post("/workflow/:workflowId", authMiddleware, executeWorkflowManually);
router.all("/webhook/:path", executeWorkflowViaWebhook);

export default router;