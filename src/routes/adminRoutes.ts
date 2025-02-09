import express, { Request, Response, NextFunction } from "express";
import { approveTutor, getPendingTutors, deleteTutor, getTutorById, getStudentById } from "../controllers/adminController";
import authMiddleware, { roleMiddleware } from "../middleware/authMiddleware";
import { adminLogin } from "../controllers/authController";
import prisma from "../config/prisma";


const router = express.Router();

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin Login
 *     tags: [Admin]
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
 *         description: Admin login successful
 *       400:
 *         description: Invalid admin credentials
 *       500:
 *         description: Internal server error
 */
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminLogin(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/approve-tutor/{tutorId}:
 *   put:
 *     summary: Approve a tutor
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: tutorId
 *         required: true
 *         description: ID of the tutor to approve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tutor approved successfully
 *       404:
 *         description: Tutor not found
 *       403:
 *         description: Unauthorized
 */
router.put(
  "/approve-tutor/:tutorId",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await approveTutor(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/admin/tutor/{tutorId}:
 *   get:
 *     summary: Fetch tutor details by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tutorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the tutor
 *     responses:
 *       200:
 *         description: Tutor details retrieved successfully
 *       404:
 *         description: Tutor not found
 *       500:
 *         description: Internal server error
 */
router.get("/tutor/:tutorId", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res, next) => {
  try {
    await getTutorById(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/student/{studentId}:
 *   get:
 *     summary: Fetch student details by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the student
 *     responses:
 *       200:
 *         description: Student details retrieved successfully
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.get("/student/:studentId", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res, next) => {
  try {
    await getStudentById(req, res);
  } catch (error) {
    next(error);
  }
});


/**
 * @swagger
 * /api/admin/pending-tutors:
 *   get:
 *     summary: Get all pending tutor approvals
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of pending tutors
 *       500:
 *         description: Internal server error
 */
router.get(
  "/pending-tutors",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getPendingTutors(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/admin/tutors:
 *   get:
 *     summary: Get all tutors
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tutors
 *       500:
 *         description: Internal server error
 */
router.get("/tutors", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res, next) => {
  try {
    const tutors = await prisma.user.findMany({
      where: { role: "TUTOR" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        programSpecialty: true,
        certificateUrl: true,
        isApproved: true,
        createdAt: true,
      },
    });
    res.json({ tutors });
  } catch (error) {
    console.error("Error fetching tutors:", error);
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/students:
 *   get:
 *     summary: Get all students
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all students
 *       500:
 *         description: Internal server error
 */
router.get("/students", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        phoneNumber: true,
        createdAt: true,
      },
    });
    res.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/delete-tutor/{tutorId}:
 *   delete:
 *     summary: Reject and delete a tutor application
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: tutorId
 *         required: true
 *         description: ID of the tutor to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tutor application rejected
 *       404:
 *         description: Tutor not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/delete-tutor/:tutorId",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteTutor(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;