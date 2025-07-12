import { z } from 'zod';
import { VALIDATION } from '../config/constants.js';

export const createRatingSchema = z.object({
  toUserId: z.string().uuid('Invalid user ID'),
  score: z.number().min(VALIDATION.RATING_MIN, `Rating must be at least ${VALIDATION.RATING_MIN}`).max(VALIDATION.RATING_MAX, `Rating must be at most ${VALIDATION.RATING_MAX}`),
  comment: z.string().max(VALIDATION.COMMENT_MAX_LENGTH, 'Comment too long').optional(),
});