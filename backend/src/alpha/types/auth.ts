import { type User } from '@prisma/client';

export interface AuthUser extends Omit<User, 'password'> {}

export interface JWTPayload {
  userId: string;
  email: string;
}