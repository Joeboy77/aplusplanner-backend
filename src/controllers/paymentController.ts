import { Request, Response } from "express";
import prisma from "../config/prisma";
import { initializePayment, verifyPayment } from "../services/paystackService";
import { sendEmail } from "../utils/emailService";

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

// ✅ Initialize Payment for Assignment
export const initializePaymentForAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user?.id;

    if (!req.user?.email) {
      return res.status(400).json({ message: "Student email is required to initialize payment." });
    }

    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, studentId },
    });

    if (!assignment || !assignment.tutorCharge) {
      return res.status(404).json({ message: "Assignment not found or price not set." });
    }

    const paymentData = await initializePayment(req.user.email, assignment.tutorCharge, assignmentId);

    res.json({
      message: "Payment initialized successfully.",
      authorization_url: paymentData.data.authorization_url,
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};

// ✅ Verify Payment for Assignment
export const verifyPaymentForAssignment = async (req: AuthRequest, res: Response) => {
    try {
      const { reference } = req.query;
  
      if (!reference) {
        return res.status(400).json({ message: "Payment reference is required." });
      }
  
      const verificationData = await verifyPayment(reference.toString());
  
      if (verificationData.data.status === "success") {
        const assignmentId = verificationData.data.metadata.assignmentId;
  
        if (!assignmentId) {
          return res.status(400).json({ message: "Assignment ID missing from payment verification data." });
        }
  
        const assignment = await prisma.assignment.update({
          where: { id: assignmentId },
          data: { isPaid: true },
          include: { Student: true },  // Include student information for email
        });
  
        // ✅ Send email with the download link
        if (assignment.Student?.email && assignment.completedFileUrl) {
          await sendEmail({
            to: assignment.Student.email,
            subject: "Assignment Solution Available",
            text: `Your assignment "${assignment.title}" is now available. Please download your solution from the following link: ${process.env.BASE_URL}/api/assignments/download/${assignment.id}`,
          });
        }
  
        return res.json({ message: "Payment verified successfully!", assignment });
      } else {
        return res.status(400).json({ message: "Payment verification failed." });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };
