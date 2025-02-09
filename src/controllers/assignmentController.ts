import { Request, Response } from "express";
import prisma from "../config/prisma";
import cloudinary from "../config/cloudinary";
import { sendEmail } from "../utils/emailService";


interface AuthRequest extends Request {
    user?: { id: string; role: string; programSpecialty?: string };
  }
  

// ✅ Student submits assignment
export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, programSpecialty } = req.body;
    const studentId = req.user?.id; // ✅ Now TypeScript recognizes `user`
    const file = req.file;

    if (!studentId) {
      res.status(401).json({ message: "Unauthorized: No student ID found." });
      return;
    }

    if (!file) {
      res.status(400).json({ message: "Assignment file is required!" });
      return;
    }

    // ✅ Upload file to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "assignments", resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file.buffer);
    });

    const fileUrl = (uploadResult as any).secure_url;

    // ✅ Store assignment details in the database
    const assignment = await prisma.assignment.create({
      data: {
        studentId,
        title,
        description,
        programSpecialty,
        fileUrl,
        status: "Pending", // Default status
        submittedAt: new Date(),
      },
    });

    // ✅ Notify Admin via Email (Fixed)
    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: "New Assignment Submitted",
      text: `A new assignment has been submitted by a student.\n\nTitle: ${title}\nProgram Specialty: ${programSpecialty}\nStatus: Pending`,
    });

    res.status(201).json({ message: "Assignment submitted successfully!", assignment });
  } catch (error) {
    console.error("Error submitting assignment:", error);
    res.status(500).json({ message: "Something went wrong", error });
  }
};

export const getPendingAssignments = async (req: Request, res: Response) => {
    try {
      const assignments = await prisma.assignment.findMany({
        where: { status: "Pending" },
        include: { Student: true },
      });
  
      res.json({ assignments });
    } catch (error) {
      console.error("Error fetching pending assignments:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };

  export const assignAssignment = async (req: Request, res: Response) => {
    try {
      const { assignmentId } = req.params;
  
      // Check if the assignment exists
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
      });
  
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
  
      // Update the status to Assigned without specifying a tutor yet
      await prisma.assignment.update({
        where: { id: assignmentId },
        data: { status: "Assigned" },
      });
  
      res.json({ message: "Assignment is now open for tutors with matching program specialty." });
    } catch (error) {
      console.error("Error assigning assignment:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };
  

  export const getTutorPendingAssignments = async (req: AuthRequest, res: Response) => {
    try {
      const tutorId = req.user?.id;
      const programSpecialty = req.user?.programSpecialty;
  
      if (!tutorId || !programSpecialty) {
        return res.status(401).json({ message: "Unauthorized." });
      }
  
      // Find all assignments with the same program specialty that haven't been accepted yet
      const assignments = await prisma.assignment.findMany({
        where: {
          programSpecialty,
          status: "Assigned",
          assignedTutorId: null,
        },
        include: { Student: true },
      });
  
      res.json({ assignments });
    } catch (error) {
      console.error("Error fetching tutor pending assignments:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };
  
  export const reviewAndSetPrice = async (req: AuthRequest, res: Response) => {
    try {
      const { assignmentId } = req.params;
      let { price } = req.body;
      const tutorId = req.user?.id;
  
      if (!tutorId) {
        return res.status(401).json({ message: "Unauthorized." });
      }
  
      price = Number(price);
  
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ message: "Invalid price. It must be a positive number." });
      }
  
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId, assignedTutorId: tutorId },
        include: { Student: true },
      });
  
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found or not assigned to you." });
      }
  
      if (assignment.status !== "Assigned") {
        return res.status(400).json({ message: "Assignment is not in an assignable state." });
      }
  
      await prisma.assignment.update({
        where: { id: assignmentId },
        data: { status: "In Progress", tutorCharge: price },
      });
  
      // Send emails to admin and student
      await sendEmail({
        to: assignment.Student.email,
        subject: "Assignment Accepted and Priced",
        text: `Hello ${assignment.Student.firstName},\n\nThe tutor has accepted your assignment titled "${assignment.title}" and set the price at GHS ${price.toFixed(
          2
        )}.\n\nPlease proceed with payment to continue.\n\nBest regards,\nA+ Planner Team`,
      });
  
      await sendEmail({
        to: process.env.ADMIN_EMAIL!,
        subject: "Tutor Accepted and Priced Assignment",
        text: `The assignment titled "${assignment.title}" has been accepted by the tutor.\nThe tutor has set the price at GHS ${price.toFixed(
          2
        )}.\n\nBest regards,\nA+ Planner Team`,
      });
  
      res.json({ message: `Assignment accepted and price set to GHS ${price.toFixed(2)}.` });
    } catch (error) {
      console.error("Error in reviewAndSetPrice:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };
  
  export const getAllAssignments = async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const filter = status ? { status: status.toString() } : {};
  
      const assignments = await prisma.assignment.findMany({
        where: filter,
        include: { Student: true, Tutor: true },  // Ensure relations are fetched
      });
  
      res.json({ assignments });
    } catch (error) {
      console.error("Error fetching all assignments:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };
  
  export const getAssignmentById = async (req: Request, res: Response) => {
    try {
      const { assignmentId } = req.params;
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { Student: true, Tutor: true },
      });
  
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
  
      res.json({ assignment });
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };

  export const assignAssignmentToTutor = async (req: Request, res: Response) => {
    try {
      const { assignmentId } = req.params;
      const { tutorId } = req.body;
  
      // Check if the assignment exists
      const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
  
      // Check if the tutor exists and is approved
      const tutor = await prisma.user.findFirst({
        where: {
          id: tutorId,
          role: "TUTOR",
          isApproved: true,
        },
      });
  
      if (!tutor) {
        return res.status(404).json({ message: "Tutor not found or not approved." });
      }
  
      // Update the assignment with the assigned tutor ID
      await prisma.assignment.update({
        where: { id: assignmentId },
        data: { assignedTutorId: tutorId, status: "Assigned" },
      });
  
      // ✅ Send email to the tutor and admin
      await sendEmail({
        to: tutor.email,
        subject: "New Assignment Assigned to You",
        text: `Dear ${tutor.firstName},\n\nA new assignment has been assigned to you. Please log in to your account to review and start working on it.\n\nAssignment Title: ${assignment.title}\n\nThank you for your collaboration.\n\nBest regards,\nA+ Planner Team`,
      });
  
      await sendEmail({
        to: process.env.ADMIN_EMAIL!,
        subject: "Assignment Assigned Notification",
        text: `An assignment has been successfully assigned to tutor ${tutor.firstName} ${tutor.lastName}.\n\nAssignment Title: ${assignment.title}\nTutor Email: ${tutor.email}\n\nThank you for managing the assignment distribution.\n\nBest regards,\nA+ Planner Team`,
      });
  
      res.json({ message: `Assignment assigned to tutor ${tutor.firstName} ${tutor.lastName}.` });
    } catch (error) {
      console.error("Error assigning assignment:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };
  
  
  
  
  export const getTutorAssignments = async (req: AuthRequest, res: Response) => {
    try {
      const tutorId = req.user?.id;
  
      const assignments = await prisma.assignment.findMany({
        where: { assignedTutorId: tutorId },
        include: { Student: true },
      });
  
      if (!assignments || assignments.length === 0) {
        return res.status(404).json({ message: "No assignments found for this tutor." });
      }
  
      res.json({ assignments });
    } catch (error) {
      console.error("Error fetching tutor assignments:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };
  

  export const completeAssignment = async (req: AuthRequest, res: Response) => {
    try {
      const { assignmentId } = req.params;
      const { fileUrl } = req.body;
  
      const assignment = await prisma.assignment.update({
        where: { id: assignmentId },
        data: {
          status: "Completed",
          completedFileUrl: fileUrl,
          completedAt: new Date(),
        },
        include: { Student: true },
      });
  
      if (!assignment || !assignment.Student?.email) {
        return res.status(404).json({ message: "Student or assignment not found." });
      }
  
      const tutorCharge = assignment.tutorCharge ?? 0; // Ensure tutorCharge is not null
  
      await sendEmail({
        to: assignment.Student.email,
        subject: "Your Assignment is Completed",
        text: `Your assignment "${assignment.title}" has been completed. To access the solution file, please proceed with the payment of GHS ${tutorCharge.toFixed(
          2
        )}. Once payment is confirmed, you will be able to download the solution.`,
      });
  
      res.json({ message: "Assignment marked as completed.", assignment });
    } catch (error) {
      console.error("Error completing assignment:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };
  
  
  
  

  export const getStudentAssignments = async (req: AuthRequest, res: Response) => {
    try {
      const studentId = req.user?.id;
      const assignments = await prisma.assignment.findMany({
        where: { studentId },
        include: { Tutor: true },
      });
      res.json({ assignments });
    } catch (error) {
      console.error("Error fetching student assignments:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };

  export const downloadAssignment = async (req: Request, res: Response) => {
    try {
      const { assignmentId } = req.params;
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
      });
      if (!assignment || !assignment.completedFileUrl) {
        return res.status(404).json({ message: "Completed file not found." });
      }
      res.redirect(assignment.completedFileUrl); // Redirect to the Cloudinary URL
    } catch (error) {
      console.error("Error downloading assignment:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };

  export const downloadSolutionFile = async (req: AuthRequest, res: Response) => {
    try {
      const { assignmentId } = req.params;
      const studentId = req.user?.id;
  
      const assignment = await prisma.assignment.findFirst({
        where: { id: assignmentId, studentId },
      });
  
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found." });
      }
  
      if (!assignment.isPaid) {
        return res.status(403).json({ message: "Access denied. Payment required to download the solution." });
      }
  
      if (!assignment.completedFileUrl) {
        return res.status(404).json({ message: "Solution file not found." });
      }
  
      res.redirect(assignment.completedFileUrl);  
    } catch (error) {
      console.error("Error downloading solution file:", error);
      res.status(500).json({ message: "Something went wrong", error });
    }
  };

  export const markAssignmentAsPaid = async (req: Request, res: Response): Promise<void> => {
    const { assignmentId } = req.params;
  
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      res.status(404).json({ message: "Assignment not found." });
      return;
    }
  
    if (assignment.isPaid) {
      res.status(400).json({ message: "Assignment is already marked as paid." });
      return;
    }
  
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { isPaid: true },
    });
  
    res.json({ message: "Assignment marked as paid successfully." });
  };
  
  
  export const rejectAssignment = async (req: Request, res: Response): Promise<void> => {
    const { assignmentId } = req.params;
  
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      res.status(404).json({ message: "Assignment not found." });
      return;
    }
  
    if (assignment.status !== "Assigned") {
      res.status(400).json({ message: "Assignment is not in an assignable state." });
      return;
    }
  
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: "Rejected" },
    });
  
    res.json({ message: "Assignment rejected successfully." });
  };

  
  
  



