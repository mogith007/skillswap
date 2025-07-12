import { Hono } from "hono";
import { prisma } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody } from "../middleware/validation.js";
import { createRatingSchema } from "../schemas/rating.js";
import { getPaginationParams, createPaginatedResponse } from "../utils/pagination.js";
import { HTTP_STATUS } from "../config/constants.js";

const rating = new Hono();

rating.post("/", authMiddleware, validateBody(createRatingSchema), async (c) => {
  try {
    const currentUser: any = c.get("user" as never);
    const { toUserId, score, comment } = c.get("validatedData" as never) as any;

    if (currentUser.id === toUserId) {
      return sendError(c, "Cannot rate yourself", HTTP_STATUS.BAD_REQUEST);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return sendError(c, "Target user not found", HTTP_STATUS.NOT_FOUND);
    }

    const acceptedSwap = await prisma.swapRequest.findFirst({
      where: {
        OR: [
          { fromUserId: currentUser.id, toUserId, status: "ACCEPTED" },
          { fromUserId: toUserId, toUserId: currentUser.id, status: "ACCEPTED" },
        ],
      },
    });

    if (!acceptedSwap) {
      return sendError(c, "You can only rate users after completing a swap", HTTP_STATUS.BAD_REQUEST);
    }

    const existingRating = await prisma.rating.findFirst({
      where: {
        fromUserId: currentUser.id,
        toUserId,
      },
    });

    if (existingRating) {
      return sendError(c, "You have already rated this user", HTTP_STATUS.CONFLICT);
    }

    const newRating = await prisma.rating.create({
      data: {
        fromUserId: currentUser.id,
        toUserId,
        score,
        comment,
      },
      include: {
        fromUser: {
          select: { id: true, name: true, profilePhoto: true },
        },
        toUser: {
          select: { id: true, name: true, profilePhoto: true },
        },
      },
    });

    return sendSuccess(c, newRating, "Rating created successfully", HTTP_STATUS.CREATED);
  } catch (error) {
    console.error("Create rating error:", error);
    return sendError(c, "Failed to create rating", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

rating.get("/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const { page: pageParam, limit: limitParam } = c.req.query();
    const { page, limit } = getPaginationParams(pageParam, limitParam);

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { toUserId: userId },
        include: {
          fromUser: {
            select: { id: true, name: true, profilePhoto: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rating.count({ where: { toUserId: userId } }),
    ]);

    const paginatedResponse = createPaginatedResponse(ratings, total, page, limit);

    return sendSuccess(c, paginatedResponse);
  } catch (error) {
    console.error("Get user ratings error:", error);
    return sendError(c, "Failed to fetch ratings", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

rating.get("/my-ratings", authMiddleware, async (c) => {
  try {
    const currentUser: any = c.get("user" as never);
    const { page: pageParam, limit: limitParam } = c.req.query();
    const { page, limit } = getPaginationParams(pageParam, limitParam);

    const [givenRatings, receivedRatings, totalGiven, totalReceived] = await Promise.all([
      prisma.rating.findMany({
        where: { fromUserId: currentUser.id },
        include: {
          toUser: {
            select: { id: true, name: true, profilePhoto: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rating.findMany({
        where: { toUserId: currentUser.id },
        include: {
          fromUser: {
            select: { id: true, name: true, profilePhoto: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rating.count({ where: { fromUserId: currentUser.id } }),
      prisma.rating.count({ where: { toUserId: currentUser.id } }),
    ]);

    const data = {
      given: createPaginatedResponse(givenRatings, totalGiven, page, limit),
      received: createPaginatedResponse(receivedRatings, totalReceived, page, limit),
    };

    return sendSuccess(c, data);
  } catch (error) {
    console.error("Get my ratings error:", error);
    return sendError(c, "Failed to fetch ratings", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default rating;
