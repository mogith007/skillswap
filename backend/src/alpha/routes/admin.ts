import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import { validateBody } from "../middleware/validation.js";
import { getPaginationParams, createPaginatedResponse } from "../utils/pagination.js";
import { HTTP_STATUS } from "../config/constants.js";
import { z } from "zod";

const admin = new Hono();

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const adminMiddleware = async (c: any, next: any) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return sendError(c, "Admin authorization required", HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const admin = await prisma.admin.findUnique({
      where: { email: payload.email },
    });

    if (!admin) {
      return sendError(c, "Admin not found", HTTP_STATUS.UNAUTHORIZED);
    }

    c.set("admin", admin);
    await next();
  } catch (error) {
    return sendError(c, "Invalid admin token", HTTP_STATUS.UNAUTHORIZED);
  }
};

admin.post("/login", validateBody(adminLoginSchema), async (c) => {
  try {
    const { email, password } = c.get("validatedData" as never) as any;

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return sendError(c, "Invalid admin credentials", HTTP_STATUS.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return sendError(c, "Invalid admin credentials", HTTP_STATUS.UNAUTHORIZED);
    }

    const token = signToken({ userId: admin.id, email: admin.email });

    return sendSuccess(c, { token }, "Admin login successful");
  } catch (error) {
    console.error("Admin login error:", error);
    return sendError(c, "Admin login failed", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

admin.get("/dashboard", adminMiddleware, async (c) => {
  try {
    const [totalUsers, totalSwapRequests, totalRatings, totalSkills, pendingSwaps, acceptedSwaps, rejectedSwaps] = await Promise.all([
      prisma.user.count(),
      prisma.swapRequest.count(),
      prisma.rating.count(),
      prisma.skill.count(),
      prisma.swapRequest.count({ where: { status: "PENDING" } }),
      prisma.swapRequest.count({ where: { status: "ACCEPTED" } }),
      prisma.swapRequest.count({ where: { status: "REJECTED" } }),
    ]);

    const stats = {
      totalUsers,
      totalSwapRequests,
      totalRatings,
      totalSkills,
      swapStats: {
        pending: pendingSwaps,
        accepted: acceptedSwaps,
        rejected: rejectedSwaps,
      },
    };

    return sendSuccess(c, stats);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return sendError(c, "Failed to fetch dashboard stats", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

admin.get("/users", adminMiddleware, async (c) => {
  try {
    const { page: pageParam, limit: limitParam, search } = c.req.query();
    const { page, limit } = getPaginationParams(pageParam, limitParam);

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          location: true,
          profileType: true,
          createdAt: true,
          _count: {
            select: {
              swapRequestsSent: true,
              swapRequestsReceived: true,
              ratingsReceived: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const paginatedResponse = createPaginatedResponse(users, total, page, limit);

    return sendSuccess(c, paginatedResponse);
  } catch (error) {
    console.error("Get admin users error:", error);
    return sendError(c, "Failed to fetch users", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

admin.get("/swap-requests", adminMiddleware, async (c) => {
  try {
    const { page: pageParam, limit: limitParam, status } = c.req.query();
    const { page, limit } = getPaginationParams(pageParam, limitParam);

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    const [swapRequests, total] = await Promise.all([
      prisma.swapRequest.findMany({
        where: whereClause,
        include: {
          fromUser: {
            select: { id: true, name: true, email: true },
          },
          toUser: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.swapRequest.count({ where: whereClause }),
    ]);

    const paginatedResponse = createPaginatedResponse(swapRequests, total, page, limit);

    return sendSuccess(c, paginatedResponse);
  } catch (error) {
    console.error("Get admin swap requests error:", error);
    return sendError(c, "Failed to fetch swap requests", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default admin;
