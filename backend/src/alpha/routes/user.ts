import { Hono } from "hono";
import { prisma } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validation.js";
import { updateProfileSchema, availabilitySchema, skillsSchema, searchUsersSchema } from "../schemas/user.js";
import { getPaginationParams, createPaginatedResponse } from "../utils/pagination.js";
import { HTTP_STATUS } from "../config/constants.js";

const user = new Hono();

user.get("/profile", authMiddleware, async (c) => {
  try {
    const currentUser: any = c.get("user" as never);

    const userProfile = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        profilePhoto: true,
        profileType: true,
        createdAt: true,
        availability: true,
        skillsOffered: true,
        skillsWanted: true,
        ratingsReceived: {
          select: {
            score: true,
            comment: true,
            fromUser: {
              select: { name: true },
            },
            createdAt: true,
          },
        },
        _count: {
          select: {
            swapRequestsSent: true,
            swapRequestsReceived: true,
            ratingsReceived: true,
          },
        },
      },
    });

    if (!userProfile) {
      return sendError(c, "User not found", HTTP_STATUS.NOT_FOUND);
    }

    const avgRating = userProfile.ratingsReceived.length > 0 ? userProfile.ratingsReceived.reduce((acc, rating) => acc + rating.score, 0) / userProfile.ratingsReceived.length : 0;

    const profileData = {
      ...userProfile,
      avgRating: Number(avgRating.toFixed(1)),
    };

    return sendSuccess(c, profileData);
  } catch (error) {
    console.error("Get profile error:", error);
    return sendError(c, "Failed to fetch profile", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

user.put("/profile", authMiddleware, validateBody(updateProfileSchema), async (c) => {
  try {
    const currentUser: any = c.get("user" as never);
    const updateData: any = c.get("validatedData" as never);

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        profilePhoto: true,
        profileType: true,
        createdAt: true,
      },
    });

    return sendSuccess(c, updatedUser, "Profile updated successfully");
  } catch (error) {
    console.error("Update profile error:", error);
    return sendError(c, "Failed to update profile", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

user.put("/availability", authMiddleware, validateBody(availabilitySchema), async (c) => {
  try {
    const currentUser: any = c.get("user" as never);
    const { availability } = c.get("validatedData" as never) as any;

    await prisma.availability.deleteMany({
      where: { userId: currentUser.id },
    });

    const availabilityData = availability.map((day: string) => ({
      day,
      userId: currentUser.id,
    }));

    await prisma.availability.createMany({
      data: availabilityData,
    });

    const updatedAvailability = await prisma.availability.findMany({
      where: { userId: currentUser.id },
    });

    return sendSuccess(c, updatedAvailability, "Availability updated successfully");
  } catch (error) {
    console.error("Update availability error:", error);
    return sendError(c, "Failed to update availability", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

user.put("/skills", authMiddleware, validateBody(skillsSchema), async (c) => {
  try {
    const currentUser: any = c.get("user" as never);
    const { skillsOffered, skillsWanted } = c.get("validatedData" as never) as any;

    const skillsOfferedData = await Promise.all(
      skillsOffered.map(async (skillName: string) => {
        return await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });
      })
    );

    const skillsWantedData = await Promise.all(
      skillsWanted.map(async (skillName: string) => {
        return await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });
      })
    );

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        skillsOffered: {
          set: skillsOfferedData.map((skill) => ({ id: skill.id })),
        },
        skillsWanted: {
          set: skillsWantedData.map((skill) => ({ id: skill.id })),
        },
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        skillsOffered: true,
        skillsWanted: true,
      },
    });

    return sendSuccess(c, updatedUser, "Skills updated successfully");
  } catch (error) {
    console.error("Update skills error:", error);
    return sendError(c, "Failed to update skills", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

user.get("/search", validateQuery(searchUsersSchema), async (c) => {
  try {
    const { skill, location, ...paginationParams } = c.get("validatedQuery" as never) as any;
    const { page, limit } = getPaginationParams(paginationParams.page, paginationParams.limit);

    const whereClause: any = {
      profileType: "PUBLIC",
    };

    if (skill) {
      whereClause.OR = [
        {
          skillsOffered: {
            some: {
              name: {
                contains: skill,
                mode: "insensitive",
              },
            },
          },
        },
        {
          skillsWanted: {
            some: {
              name: {
                contains: skill,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    if (location) {
      whereClause.location = {
        contains: location,
        mode: "insensitive",
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          location: true,
          profilePhoto: true,
          skillsOffered: true,
          skillsWanted: true,
          availability: true,
          ratingsReceived: {
            select: { score: true },
          },
          _count: {
            select: { ratingsReceived: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const usersWithRating = users.map((user) => {
      const avgRating = user.ratingsReceived.length > 0 ? user.ratingsReceived.reduce((acc, rating) => acc + rating.score, 0) / user.ratingsReceived.length : 0;

      const { ratingsReceived, ...userWithoutRatings } = user;
      return {
        ...userWithoutRatings,
        avgRating: Number(avgRating.toFixed(1)),
      };
    });

    const paginatedResponse = createPaginatedResponse(usersWithRating, total, page, limit);

    return sendSuccess(c, paginatedResponse);
  } catch (error) {
    console.error("Get swap requests error:", error);
    return sendError(c, "Failed to fetch swap requests", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

user.get('/:id', async (c) => {
  try {
    const userId = c.req.param('id');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        location: true,
        profilePhoto: true,
        profileType: true,
        skillsOffered: true,
        skillsWanted: true,
        availability: true,
        ratingsReceived: {
          select: {
            score: true,
            comment: true,
            fromUser: {
              select: { name: true },
            },
            createdAt: true,
          },
        },
        _count: {
          select: { ratingsReceived: true },
        },
      },
    });

    if (!user) {
      return sendError(c, 'User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (user.profileType === 'PRIVATE') {
      return sendError(c, 'User profile is private', HTTP_STATUS.FORBIDDEN);
    }

    // Calculate average rating
    const avgRating = user.ratingsReceived.length > 0
      ? user.ratingsReceived.reduce((acc, rating) => acc + rating.score, 0) / user.ratingsReceived.length
      : 0;

    const userData = {
      ...user,
      avgRating: Number(avgRating.toFixed(1)),
    };

    return sendSuccess(c, userData);
  } catch (error) {
    console.error('Get user by ID error:', error);
    return sendError(c, 'Failed to fetch user', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default user;