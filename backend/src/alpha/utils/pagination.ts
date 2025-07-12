import { type PaginationParams, type PaginatedResponse } from '../types/api.js';
import { PAGINATION } from '../config/constants.js';

export const getPaginationParams = (page?: string, limit?: string): PaginationParams => {
  const parsedPage = parseInt(page || '1', 10);
  const parsedLimit = parseInt(limit || PAGINATION.DEFAULT_LIMIT.toString(), 10);

  return {
    page: parsedPage > 0 ? parsedPage : PAGINATION.DEFAULT_PAGE,
    limit: Math.min(parsedLimit > 0 ? parsedLimit : PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
  };
};

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};