export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const JWT_CONFIG = {
  EXPIRES_IN: '7d',
  SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  SKILL_NAME_MAX_LENGTH: 100,
  MESSAGE_MAX_LENGTH: 500,
  COMMENT_MAX_LENGTH: 1000,
  RATING_MIN: 1,
  RATING_MAX: 5,
} as const;