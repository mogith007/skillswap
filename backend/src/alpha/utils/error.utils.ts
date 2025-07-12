import z from "zod";
import { HTTPException } from "hono/http-exception";

export const handleError = (error: any, message: string = "Internal server error") => {
  console.error(`Auth Error: ${message}`, error);
  
  if (error instanceof z.ZodError) {
    throw new HTTPException(400, { 
      message: "Validation failed", 
    });
  }
  
  if (error.code === 'P2002') {
    throw new HTTPException(409, { message: "Email already exists" });
  }
  
  throw new HTTPException(500, { message });
};