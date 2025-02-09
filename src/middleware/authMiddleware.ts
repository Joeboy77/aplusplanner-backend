import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: any;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.token;
    console.log("Received Token from Cookies:", token);

    if (!token) {
      res.status(401).json({ message: "Access Denied. No token provided." });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log("Decoded Token:", decoded);

    if (!decoded.email) {
      res.status(400).json({ message: "Email is missing from token." });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    res.status(403).json({ message: "Invalid Token" });
  }
};

export const roleMiddleware = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Access Denied" });
      return;
    }
    next();
  };
};

export default authMiddleware;
