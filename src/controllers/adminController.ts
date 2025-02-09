import { Request, Response } from "express";
import prisma from "../config/prisma";
import { sendEmail } from "../utils/emailService";

/**
 * Approves a tutor by the admin
 */
export const approveTutor = async (req: Request, res: Response) => {
  try {
    const { tutorId } = req.params;

    // Find the tutor
    const tutor = await prisma.user.findUnique({
      where: { id: tutorId, role: "TUTOR" },
    });

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (tutor.isApproved) {
      return res.status(400).json({ message: "Tutor is already approved" });
    }

    // Update approval status
    await prisma.user.update({
      where: { id: tutorId },
      data: { isApproved: true },
    });

    
    await sendEmail({
      to: tutor.email,
      subject: "Your Tutor Account is Approved!",
      text: "Congratulations! Your tutor account has been approved. You can now log in and start receiving assignments.",
    });

    return res.json({ message: "Tutor approved successfully!" });
  } catch (error) {
    console.error("Error approving tutor:", error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

export const getTutorById = async (req: Request, res: Response): Promise<void> => {
  const { tutorId } = req.params;

  const tutor = await prisma.user.findUnique({
    where: { id: tutorId, role: "TUTOR" },
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

  if (!tutor) {
    res.status(404).json({ message: "Tutor not found." });
    return;
  }

  res.json(tutor);
};

export const getStudentById = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  const student = await prisma.user.findUnique({
    where: { id: studentId, role: "STUDENT" },
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

  if (!student) {
    res.status(404).json({ message: "Student not found." });
    return;
  }

  res.json(student);
};


/**
 * Fetches all pending tutor approvals
 */
export const getPendingTutors = async (req: Request, res: Response) => {
  try {
    const pendingTutors = await prisma.user.findMany({
      where: { role: "TUTOR", isApproved: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        programSpecialty: true,
        certificateUrl: true,
        createdAt: true,
      },
    });

    return res.json({ pendingTutors });
  } catch (error) {
    console.error("Error fetching pending tutors:", error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
};


/**
 * Deletes a tutor if their approval is rejected
 */
export const deleteTutor = async (req: Request, res: Response) => {
  try {
    const { tutorId } = req.params;

    // Find the tutor
    const tutor = await prisma.user.findUnique({
      where: { id: tutorId, role: "TUTOR" },
    });

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    // Delete tutor from the database
    await prisma.user.delete({ where: { id: tutorId } });

    // ✅ Fix: Send email using the correct object structure
    await sendEmail({
      to: tutor.email,
      subject: "Tutor Application Rejected",
      text: "Unfortunately, your tutor application has been rejected. Please contact support for more details.",
    });

    return res.json({ message: "Tutor application rejected and deleted." });
  } catch (error) {
    console.error("Error deleting tutor:", error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
};
