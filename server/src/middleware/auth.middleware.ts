import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

// Verify that the request belongs to an authenticated user.
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check whether the session contains a user ID.
    const userId = req.session.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    // Retrieve the authenticated user's public information.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Reject the request if the user no longer exists.
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    // Make the authenticated user available to controllers.
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};