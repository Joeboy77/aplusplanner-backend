import express from "express";
import { initializePaymentForAssignment, verifyPaymentForAssignment } from "../controllers/paymentController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /api/payments/initialize/{assignmentId}:
 *   post:
 *     summary: Initialize payment for an assignment
 *     tags: [Payments]
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
 *         description: Payment initialized successfully
 *       404:
 *         description: Assignment not found or price not set
 *       500:
 *         description: Internal server error
 */
router.post("/initialize/:assignmentId", authMiddleware, async (req, res, next) => {
  try {
    await initializePaymentForAssignment(req, res);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/payments/verify:
 *   get:
 *     summary: Verify payment for an assignment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: The payment reference from Paystack
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Payment verification failed
 *       500:
 *         description: Internal server error
 */
router.get("/verify", authMiddleware, async (req, res, next) => {
  try {
    await verifyPaymentForAssignment(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
