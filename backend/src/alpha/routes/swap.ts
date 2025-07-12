import { Hono } from "hono";
import { prisma } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validation.js";
import { createSwapRequestSchema, updateSwapRequestSchema, getSwapRequestsSchema } from "../schemas/swap.js";
import { getPaginationParams, createPaginatedResponse } from "../utils/pagination.js";
import { HTTP_STATUS } from "../config/constants.js";

const swap = new Hono();

swap.post("/request", authMiddleware, validateBody(createSwapRequestSchema), async (c) => {
  try {
    const currentUser: any = c.get("user" as never);
    const { toUserId, skillOffered, skillWanted, message } = c.get("validatedData" as never) as any;

    if (currentUser.id === toUserId) {
      return sendError(c, "Cannot create swap request with yourself", HTTP_STATUS.BAD_REQUEST);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, profileType: true },
    });

    if (!targetUser) {
      return sendError(c, "Target user not found", HTTP_STATUS.NOT_FOUND);
    }

    if (targetUser.profileType === "PRIVATE") {
      return sendError(c, "Cannot send swap request to private profile", HTTP_STATUS.FORBIDDEN);
    }

    const existingRequest = await prisma.swapRequest.findFirst({
      where: {
        OR: [
          { fromUserId: currentUser.id, toUserId, status: "PENDING" },
          { fromUserId: toUserId, toUserId: currentUser.id, status: "PENDING" },
        ],
      },
    });

    if (existingRequest) {
      return sendError(c, "There is already a pending swap request between you and this user", HTTP_STATUS.CONFLICT);
    }

    const swapRequest = await prisma.swapRequest.create({
      data: {
        fromUserId: currentUser.id,
        toUserId,
        skillOffered,
        skillWanted,
        message,
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

    return sendSuccess(c, swapRequest, "Swap request created successfully", HTTP_STATUS.CREATED);
  } catch (error) {
    console.error("Create swap request error:", error);
    return sendError(c, "Failed to create swap request", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

swap.get("/requests", authMiddleware, validateQuery(getSwapRequestsSchema), async (c) => {
  try {
    const currentUser: any = c.get("user" as never);
    const { status, ...params } = c.get("validatedQuery" as never) as any;
    const { page, limit } = getPaginationParams(params.page, params.limit);

    const whereClause: any = {
      OR: [{ fromUserId: currentUser.id }, { toUserId: currentUser.id }],
    };

    if (status) {
      whereClause.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.swapRequest.findMany({
        where: whereClause,
        include: {
          fromUser: {
            select: { id: true, name: true, profilePhoto: true },
          },
          toUser: {
            select: { id: true, name: true, profilePhoto: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.swapRequest.count({ where: whereClause }),
    ]);

    const requestsWithType = requests.map((request) => ({
      ...request,
      type: request.fromUserId === currentUser.id ? "sent" : "received",
    }));

    const paginatedResponse = createPaginatedResponse(requestsWithType, total, page, limit);

    return sendSuccess(c, paginatedResponse);
  } catch (error) {
    console.error("Get swap requests error:", error);
    return sendError(c, "Failed to fetch swap requests", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

swap.put("/request/:id", authMiddleware, validateBody(updateSwapRequestSchema), async (c) => {
  try {
    const currentUser: any = c.get("user" as never);
    const requestId = c.req.param("id");
    const { status }: any = c.get("validatedData" as never);

    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: requestId },
      include: {
        fromUser: {
          select: { id: true, name: true, profilePhoto: true },
        },
        toUser: {
          select: { id: true, name: true, profilePhoto: true },
        },
      },
    });

    if (!swapRequest) {
      return sendError(c, "Swap request not found", HTTP_STATUS.NOT_FOUND);
    }

    if (status === "DELETED" && swapRequest.fromUserId !== currentUser.id) {
      return sendError(c, "Only the sender can delete a swap request", HTTP_STATUS.FORBIDDEN);
    }

    if ((status === "ACCEPTED" || status === "REJECTED") && swapRequest.toUserId !== currentUser.id) {
      return sendError(c, "Only the recipient can accept or reject a swap request", HTTP_STATUS.FORBIDDEN);
    }

    if (swapRequest.status !== "PENDING") {
      return sendError(c, "Swap request has already been processed", HTTP_STATUS.BAD_REQUEST);
    }

    const updatedRequest = await prisma.swapRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        fromUser: {
          select: { id: true, name: true, profilePhoto: true },
        },
        toUser: {
          select: { id: true, name: true, profilePhoto: true },
        },
      },
    });

    return sendSuccess(c, updatedRequest, "Swap request updated successfully");
  } catch (error) {
    console.error("Update swap request error:", error);
    return sendError(c, "Failed to update swap request", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

swap.get("/request/:id", authMiddleware, async (c) => {
  try {
    const currentUser: any = c.get("user" as never);
    const requestId = c.req.param("id");

    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: requestId },
      include: {
        fromUser: {
          select: { id: true, name: true, profilePhoto: true },
        },
        toUser: {
          select: { id: true, name: true, profilePhoto: true },
        },
      },
    });

    if (!swapRequest) {
      return sendError(c, "Swap request not found", HTTP_STATUS.NOT_FOUND);
    }

    if (swapRequest.fromUserId !== currentUser.id && swapRequest.toUserId !== currentUser.id) {
      return sendError(c, "Access denied", HTTP_STATUS.FORBIDDEN);
    }

    const requestWithType = {
      ...swapRequest,
      type: swapRequest.fromUserId === currentUser.id ? "sent" : "received",
    };

    return sendSuccess(c, requestWithType);
  } catch (error) {
    console.error("Get swap request error:", error);
    return sendError(c, "Failed to fetch swap request", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default swap;
