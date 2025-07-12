import { Hono } from 'hono';
import { prisma } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination.js';
import { HTTP_STATUS } from '../config/constants.js';

const skill = new Hono();

skill.get('/', async (c) => {
  try {
    const { search, page: pageParam, limit: limitParam } = c.req.query();
    const { page, limit } = getPaginationParams(pageParam, limitParam);

    const whereClause: any = {};

    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              offeredBy: true,
              wantedBy: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.skill.count({ where: whereClause }),
    ]);

    const paginatedResponse = createPaginatedResponse(skills, total, page, limit);

    return sendSuccess(c, paginatedResponse);
  } catch (error) {
    console.error('Get skills error:', error);
    return sendError(c, 'Failed to fetch skills', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

skill.get('/popular', async (c) => {
  try {
    const { limit: limitParam } = c.req.query();
    const limit = Math.min(parseInt(limitParam || '10', 10), 50);

    const skills = await prisma.skill.findMany({
      include: {
        _count: {
          select: {
            offeredBy: true,
            wantedBy: true,
          },
        },
      },
      orderBy: [
        { offeredBy: { _count: 'desc' } },
        { wantedBy: { _count: 'desc' } },
      ],
      take: limit,
    });

    return sendSuccess(c, skills);
  } catch (error) {
    console.error('Get popular skills error:', error);
    return sendError(c, 'Failed to fetch popular skills', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default skill;