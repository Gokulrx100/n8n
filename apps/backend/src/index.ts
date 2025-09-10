import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./utils/connectDB";
import authRoutes from "./routes/authRoutes";
import workflowRoutes from "./routes/workflowRoutes";

const app = express();
const PORT = process.env.PORT!;

app.use(cors());
app.use(express.json());

connectDB();

app.use("/auth", authRoutes);
app.use("/workflow", workflowRoutes);

app.listen(PORT);