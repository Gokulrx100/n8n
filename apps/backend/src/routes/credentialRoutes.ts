import { Router } from "express";
import { authMiddleware } from "../utils/authMiddleware";
import { createCredential, getAllCredentials, deleteCredential } from "../controllers/credentialController";

const router : Router = Router();

router.post("/", authMiddleware, createCredential);
router.get("/", authMiddleware, getAllCredentials);
router.delete("/:id", authMiddleware, deleteCredential);

export default router;