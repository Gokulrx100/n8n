import { Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface authRequest extends Request {
    user? : {userId : string};
}

export const authMiddleware = (req : authRequest, res : Response, next : NextFunction) => {
    const token = req.headers["token"] as string;

    if(!token) {
        return res.status(401).json({ message : "No token found"});
    }

    try{
        const decoded = jwt.verify(token, JWT_SECRET) as {userId : string};
        req.user = { userId : decoded.userId };
        next();
    }catch(err){
        return res.status(401).json({ message : "Invalid token"});
    }
};
