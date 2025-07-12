import { HTTPException } from "hono/http-exception";
import { verifyToken } from "../utils/auth.utils.js";

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