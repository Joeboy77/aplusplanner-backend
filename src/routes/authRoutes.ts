import express from "express";
import { registerStudent, registerTutor, login } from "../controllers/authController";
import upload from "../middleware/upload";

const router = express.Router();

/**
 * @swagger
 * /api/auth/register/student:
 *   post:
 *     summary: Register a new student
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               department:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               momoNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student registered successfully
 *       400:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
router.post("/register/student", async (req, res) => {
  await registerStudent(req, res);
});

/**
 * @swagger
 * /api/auth/register/tutor:
 *   post:
 *     summary: Register a new tutor (requires admin approval)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               programSpecialty:
 *                 type: string
 *               certificate:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Tutor registered successfully! Awaiting admin approval.
 *       400:
 *         description: Email already exists!
 *       500:
 *         description: Internal server error
 */
router.post("/register/tutor", upload.single("certificate"), async (req, res) => {
  await registerTutor(req, res);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post("/login", async (req, res) => {
  await login(req, res);
});

export default router;
