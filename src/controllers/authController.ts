import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import cloudinary from "../config/cloudinary";

// Static Admin Credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@aplusplanner.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";
const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Admin Login
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!JWT_SECRET) {
      return res.status(500).json({ message: "Server Error: JWT secret not configured." });
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { role: "ADMIN", email: ADMIN_EMAIL },  // Added email field
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 3600000,  // 1 hour
      });

      return res.json({ message: "Admin login successful" });
    }

    return res.status(400).json({ message: "Invalid admin credentials" });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

// ✅ Student Registration
export const registerStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, department, phoneNumber, momoNumber } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({ message: "All fields are required!" });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "Email already exists!" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { firstName, lastName, email, password: hashedPassword, role: "STUDENT", department, phoneNumber, momoNumber, isApproved: true },
    });

    res.status(201).json({ message: "Student registered successfully!", user });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

// ✅ Tutor Registration
export const registerTutor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, programSpecialty } = req.body;
    const certificate = req.file;

    if (!certificate) {
      res.status(400).json({ message: "Certificate file is required!" });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "Email already exists!" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Upload certificate to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "tutor_certificates", resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(certificate.buffer);
    });

    const certificateUrl = (uploadResult as any).secure_url;

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "TUTOR",
        programSpecialty,
        certificateUrl,
        isVerified: false,
        isApproved: false,
      },
    });

    res.status(201).json({ message: "Tutor registered successfully! Awaiting admin approval.", user });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};

// ✅ User Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    if (user.role === "TUTOR" && !user.isApproved) {
      res.status(403).json({ message: "Tutor is awaiting admin approval." });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },  // Include email in the token
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,  // 1 hour
    });

    res.json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error });
  }
};
