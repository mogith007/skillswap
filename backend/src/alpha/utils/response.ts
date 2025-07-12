import { type Context } from 'hono';
import { type APIResponse } from '../types/api.js';
import { HTTP_STATUS } from '../config/constants.js';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const sendSuccess = <T>(
  c: Context,
  data?: T,
  message?: string,
  statusCode = HTTP_STATUS.OK as ContentfulStatusCode
) => {
  const response: APIResponse<T> = {
    success: true,
    ...(data && { data }),
    ...(message && { message }),
  };
  return c.json(response, statusCode);
};

export const sendError = (
  c: Context,
  message: string,
  statusCode = HTTP_STATUS.BAD_REQUEST as ContentfulStatusCode,
  errors?: string[]
) => {
  const response: APIResponse = {
    success: false,
    message,
    ...(errors && { errors }),
  };
  return c.json(response, statusCode);
};