import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { HTTPException } from "hono/http-exception";

const JWT_SECRET = process.env.JWT_SECRET  || "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const SALT_ROUNDS = process.env.SALT_ROUNDS || "";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: Number(JWT_EXPIRES_IN) });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }
};

export const verifyAuthToken = async (c: any, next: any) => {
  try {
    const authHeader = c.req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HTTPException(401, { message: "Authorization token required" });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    c.set("user", decoded);
    
    await next();
  } catch (error) {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }
};

