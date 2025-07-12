import type { Context, Next } from 'hono';
import type { ZodSchema } from 'zod';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

export const validateBody = (schema: ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const result = schema.safeParse(body);
      
      if (!result.success) {
        return sendError(c, 'Validation failed', HTTP_STATUS.BAD_REQUEST);
      }
      
      c.set('validatedData', result.data);
      await next();
    } catch (error) {
      return sendError(c, 'Invalid JSON body', HTTP_STATUS.BAD_REQUEST);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      const result = schema.safeParse(query);
      
      if (!result.success) {
        return sendError(c, 'Query validation failed', HTTP_STATUS.BAD_REQUEST);
      }
      
      c.set('validatedQuery', result.data);
      await next();
    } catch (error) {
      return sendError(c, 'Invalid query parameters', HTTP_STATUS.BAD_REQUEST);
    }
  };
};