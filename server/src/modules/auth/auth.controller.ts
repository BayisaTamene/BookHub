
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { hashPassword } from "../../utils/password.js";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const passwordHash = await hashPassword(req.body.password);

    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        passwordHash,
        role: "READER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      data: user,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
      return;
    }

    next(error);
  }
};
