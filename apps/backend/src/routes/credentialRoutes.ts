import { Router } from "express";
import { authMiddleware } from "../utils/authMiddleware";
import { createCredential, getAllCredentials, deleteCredential, editCredential } from "../controllers/credentialController";

const router : Router = Router();

router.post("/", authMiddleware, createCredential);
router.get("/", authMiddleware, getAllCredentials);
router.delete("/:id", authMiddleware, deleteCredential);
router.put("/:id", authMiddleware, editCredential);

export default router;