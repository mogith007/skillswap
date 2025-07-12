import { z } from 'zod';
import { ProfileType } from '@prisma/client';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  location: z.string().optional(),
  profilePhoto: z.string().url('Invalid profile photo URL').optional(),
  profileType: z.nativeEnum(ProfileType).optional(),
});

export const availabilitySchema = z.object({
  availability: z.array(z.string().min(1, 'Availability day is required')),
});

export const skillsSchema = z.object({
  skillsOffered: z.array(z.string().min(1, 'Skill name is required').max(100, 'Skill name too long')),
  skillsWanted: z.array(z.string().min(1, 'Skill name is required').max(100, 'Skill name too long')),
});

export const searchUsersSchema = z.object({
  skill: z.string().optional(),
  location: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});