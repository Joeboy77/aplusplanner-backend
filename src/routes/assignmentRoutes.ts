import express from "express";
import { 
  getPendingAssignments, 
  getTutorPendingAssignments, 
  submitAssignment, 
  getAllAssignments, 
  getAssignmentById, 
  getTutorAssignments, 
  completeAssignment, 
  getStudentAssignments, 
  downloadAssignment, 
  downloadSolutionFile,
  assignAssignmentToTutor,
  reviewAndSetPrice,
  markAssignmentAsPaid,
  rejectAssignment
} from "../controllers/assignmentController";
import upload from "../middleware/upload";
import authMiddleware, { roleMiddleware } from "../middleware/authMiddleware";
import prisma from "../config/prisma";


const router = express.Router();

/**
 * @swagger
 * /api/assignments/submit:
 *   post:
 *     summary: Submit a new assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               programSpecialty:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Assignment submitted successfully!
 *       400:
 *         description: Missing fields or file
 *       500:
 *         description: Server error
 */
router.post("/submit", authMiddleware, upload.single("file"), async (req, res, next) => {
  try {
    await submitAssignment(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/assignments/pending:
 *   get:
 *     summary: Get all pending assignments (Admin)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending assignments
 *       500:
 *         description: Internal server error
 */
router.get("/pending", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res, next) => {
    try {
      await getPendingAssignments(req, res);
    } catch (error) {
      next(error);
    }
  });

  /**
 * @swagger
 * /api/assignments/mark-paid/{assignmentId}:
 *   put:
 *     summary: Mark an assignment as paid (Admin or Student)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assignment
 *     responses:
 *       200:
 *         description: Assignment marked as paid successfully
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Internal server error
 */
router.put("/mark-paid/:assignmentId", authMiddleware, roleMiddleware(["ADMIN", "STUDENT"]), async (req, res, next) => {
    try {
      await markAssignmentAsPaid(req, res);
    } catch (error) {
      next(error);
    }
  });

  /**
 * @swagger
 * /api/assignments/tutor-pending:
 *   get:
 *     summary: Get all pending assignments for logged-in tutor
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tutor's pending assignments
 *       500:
 *         description: Internal server error
 */
router.get("/tutor-pending", authMiddleware, roleMiddleware(["TUTOR"]), async (req, res, next) => {
    try {
      await getTutorPendingAssignments(req, res);
    } catch (error) {
      next(error);
    }
  });

/**
 * @swagger
 * /api/assignments:
 *   get:
 *     summary: Get all assignments with optional status filter
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter assignments by status (Pending, In Progress, Completed)
 *     responses:
 *       200:
 *         description: List of assignments
 *       500:
 *         description: Internal server error
 */
router.get("/", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res, next) => {
  try {
    await getAllAssignments(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/assignments/assign/{assignmentId}:
 *   put:
 *     summary: Assign an assignment to a tutor
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assignment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tutorId:
 *                 type: string
 *                 description: The ID of the tutor to assign
 *     responses:
 *       200:
 *         description: Assignment assigned to the tutor
 *       404:
 *         description: Assignment or tutor not found
 *       500:
 *         description: Internal server error
 */
router.put("/assign/:assignmentId", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res, next) => {
    try {
      await assignAssignmentToTutor(req, res);
    } catch (error) {
      next(error);
    }
  });

  /**
 * @swagger
 * /api/assignments/review-and-price/{assignmentId}:
 *   put:
 *     summary: Tutor accepts the assignment and sets the price in one step
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assignment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *                 description: Price set by the tutor
 *     responses:
 *       200:
 *         description: Assignment accepted and price set successfully
 *       400:
 *         description: Invalid input or assignment state
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Internal server error
 */
router.put("/review-and-price/:assignmentId", authMiddleware, roleMiddleware(["TUTOR"]), async (req, res, next) => {
    try {
      await reviewAndSetPrice(req, res);
    } catch (error) {
      next(error);
    }
  });
  

/**
 * @swagger
 * /api/assignments/{assignmentId}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assignment details
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Internal server error
 */
router.get("/:assignmentId", authMiddleware, async (req, res, next) => {
  try {
    await getAssignmentById(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/assignments/tutor:
 *   get:
 *     summary: Get all assignments assigned to the logged-in tutor
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tutor assignments
 *       500:
 *         description: Internal server error
 */
router.get("/tutor", authMiddleware, roleMiddleware(["TUTOR"]), async (req, res, next) => {
  try {
    await getTutorAssignments(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/assignments/complete/{assignmentId}:
 *   put:
 *     summary: Mark an assignment as completed
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileUrl:
 *                 type: string
 *                 example: https://cloudinary.com/assignment.pdf
 *     responses:
 *       200:
 *         description: Assignment marked as completed
 *       500:
 *         description: Internal server error
 */
router.put("/complete/:assignmentId", authMiddleware, roleMiddleware(["TUTOR"]), async (req, res, next) => {
  try {
    await completeAssignment(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/assignments/student:
 *   get:
 *     summary: Get all assignments submitted by the logged-in student
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of student assignments
 *       500:
 *         description: Internal server error
 */
router.get("/student", authMiddleware, roleMiddleware(["STUDENT"]), async (req, res, next) => {
  try {
    await getStudentAssignments(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/assignments/download/{assignmentId}:
 *   get:
 *     summary: Download the completed file of an assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to the completed file URL
 *       404:
 *         description: Completed file not found
 *       500:
 *         description: Internal server error
 */
router.get("/download/:assignmentId", authMiddleware, async (req, res, next) => {
  try {
    await downloadAssignment(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/assignments/download/{assignmentId}:
 *   get:
 *     summary: Download the completed file of an assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assignment to download the completed file for
 *     responses:
 *       302:
 *         description: Redirect to the completed file URL
 *       403:
 *         description: Access denied if payment has not been made
 *       404:
 *         description: Assignment or file not found
 *       500:
 *         description: Internal server error
 */
router.get("/download/completed/:assignmentId", authMiddleware, async (req, res, next) => {
    try {
      await downloadSolutionFile(req, res);
    } catch (error) {
      next(error);
    }
  });

  /**
 * @swagger
 * /api/assignments:
 *   get:
 *     summary: Get all assignments with optional status filter and pagination
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter assignments by status (Pending, Assigned, In Progress, Completed)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of assignments with pagination info
 *       500:
 *         description: Internal server error
 */
router.get("/", authMiddleware, roleMiddleware(["ADMIN"]), async (req, res, next) => {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const filter = status ? { status: status.toString() } : {};
  
      const assignments = await prisma.assignment.findMany({
        where: filter,
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        include: { Student: true, Tutor: true },
      });
  
      const totalCount = await prisma.assignment.count({ where: filter });
  
      res.json({
        total: totalCount,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        assignments,
      });
    } catch (error) {
      console.error("Error fetching assignments:", error);
      next(error);
    }
  });

  /**
 * @swagger
 * /api/assignments/download/completed/{assignmentId}:
 *   get:
 *     summary: Download completed assignment file (requires payment)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assignment to download
 *     responses:
 *       302:
 *         description: Redirect to the completed file URL
 *       403:
 *         description: Access denied if payment has not been made
 *       404:
 *         description: Assignment or file not found
 *       500:
 *         description: Internal server error
 */
router.get("/download/completed/:assignmentId", authMiddleware, async (req, res, next) => {
    try {
      await downloadSolutionFile(req, res);
    } catch (error) {
      next(error);
    }
  });

  /**
 * @swagger
 * /api/assignments/reject/{assignmentId}:
 *   put:
 *     summary: Tutor rejects the assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the assignment to reject
 *     responses:
 *       200:
 *         description: Assignment rejected successfully
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Internal server error
 */
router.put("/reject/:assignmentId", authMiddleware, roleMiddleware(["TUTOR"]), async (req, res, next) => {
    try {
      await rejectAssignment(req, res);
    } catch (error) {
      next(error);
    }
  });

  /**
 * @swagger
 * /api/assignments/mark-paid/{assignmentId}:
 *   put:
 *     summary: Mark an assignment as paid (Admin or Student)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the assignment
 *     responses:
 *       200:
 *         description: Assignment marked as paid successfully
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Internal server error
 */
router.put("/mark-paid/:assignmentId", authMiddleware, roleMiddleware(["ADMIN", "STUDENT"]), async (req, res, next) => {
    try {
      await markAssignmentAsPaid(req, res);
    } catch (error) {
      next(error);
    }
  });
  
  

export default router;
