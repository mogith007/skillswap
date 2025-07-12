import { type Context, type Next } from "hono";
import { verifyToken } from "../utils/jwt.js";
import { sendError } from "../utils/response.js";
import { HTTP_STATUS } from "../config/constants.js";
import { prisma } from "../config/database.js";

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return sendError(c, "Authorization token required", HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        location: true,
        profilePhoto: true,
        profileType: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendError(c, "User not found", HTTP_STATUS.UNAUTHORIZED);
    }

    c.set("user", user);
    await next();
  } catch (error) {
    return sendError(c, "Invalid or expired token", HTTP_STATUS.UNAUTHORIZED);
  }
};
