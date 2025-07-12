import { z } from 'zod';
import { SwapStatus } from '@prisma/client';
import { VALIDATION } from '../config/constants.js';

export const createSwapRequestSchema = z.object({
  toUserId: z.string().uuid('Invalid user ID'),
  skillOffered: z.string().min(1, 'Skill offered is required').max(VALIDATION.SKILL_NAME_MAX_LENGTH, 'Skill name too long'),
  skillWanted: z.string().min(1, 'Skill wanted is required').max(VALIDATION.SKILL_NAME_MAX_LENGTH, 'Skill name too long'),
  message: z.string().max(VALIDATION.MESSAGE_MAX_LENGTH, 'Message too long').optional(),
});

export const updateSwapRequestSchema = z.object({
  status: z.nativeEnum(SwapStatus),
});

export const getSwapRequestsSchema = z.object({
  status: z.nativeEnum(SwapStatus).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});