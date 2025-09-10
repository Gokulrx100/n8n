import UserModel from "../models/User";
import { Request, Response } from "express";
import { hashPassword, comparePassword } from "../utils/passwordUtils";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const hashed = await hashPassword(password);
    const newUser = new UserModel({ email: email, password: hashed });
    await newUser.save();

    res.status(200).json({ message: "User Created" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({
          message: "Invalid Credentials, user with this email not found",
        });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(404).json({ message: "Incorrect password" });
    }

    const token = jwt.sign({userId : user._id}, JWT_SECRET, {expiresIn : "1d"});

    res.json({ message: "Signed in successfully" , token});
  } catch (err) {
    console.log("signin error : ", err);
    res.status(500).json({ message: "Server error", error: err });
  }
};


