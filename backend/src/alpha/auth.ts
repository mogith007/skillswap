import { Hono} from "hono";
import { PrismaClient } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { signupSchema, signinSchema, forgotPasswordSchema, resetPasswordSchema } from "../../schema/auth.schema.js";
import { hashPassword, generateToken, comparePassword, verifyToken } from "./utils/auth.utils.js";
import { handleError } from "./utils/error.utils.js";

const prisma = new PrismaClient();

const auth = new Hono();

auth.post("/signup", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = signupSchema.parse(body);
    
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      throw new HTTPException(409, { message: "User with this email already exists" });
    }
    
    const hashedPassword = await hashPassword(validatedData.password);
    
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        location: validatedData.location,
        profilePhoto: validatedData.profilePhoto,
        profileType: validatedData.profileType,
      },
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        profilePhoto: true,
        profileType: true,
        createdAt: true,
      }
    });
    
    const token = generateToken({ userId: user.id, email: user.email });
    
    return c.json({
      success: true,
      message: "User created successfully",
      data: {
        user,
        token,
      }
    }, 201);
    
  } catch (error) {
    handleError(error, "Failed to create user");
  }
});

auth.post("/signin", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = signinSchema.parse(body);
    
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (!user) {
      throw new HTTPException(401, { message: "Invalid email or password" });
    }
    
    const isValidPassword = await comparePassword(validatedData.password, user.password);
    
    if (!isValidPassword) {
      throw new HTTPException(401, { message: "Invalid email or password" });
    }
    
    const token = generateToken({ userId: user.id, email: user.email });
    
    return c.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          location: user.location,
          profilePhoto: user.profilePhoto,
          profileType: user.profileType,
          createdAt: user.createdAt,
        },
        token,
      }
    });
    
  } catch (error) {
    handleError(error, "Failed to sign in");
  }
});

auth.post("/forgot-password", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = forgotPasswordSchema.parse(body);
    
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (!user) {
      return c.json({
        success: true,
        message: "If an account with this email exists, you will receive password reset instructions",
      });
    }
    
    const resetToken = generateToken({ 
      userId: user.id, 
      email: user.email, 
      type: "password_reset" 
    });
    
    
    return c.json({
      success: true,
      message: "Password reset instructions sent to your email",
    });
    
  } catch (error) {
    handleError(error, "Failed to process forgot password request");
  }
});

auth.post("/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const validatedData = resetPasswordSchema.parse(body);
    
    const decoded = verifyToken(validatedData.token);
    
    if (decoded.type !== "password_reset") {
      throw new HTTPException(400, { message: "Invalid reset token" });
    }
    
    const hashedPassword = await hashPassword(validatedData.newPassword);
    
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        profilePhoto: true,
        profileType: true,
      }
    });
    
    return c.json({
      success: true,
      message: "Password reset successful",
      data: { user }
    });
    
  } catch (error) {
    handleError(error, "Failed to reset password");
  }
});

auth.get("/me", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HTTPException(401, { message: "Authorization token required" });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        profilePhoto: true,
        profileType: true,
        createdAt: true,
        skillsOffered: {
          select: {
            id: true,
            name: true,
          }
        },
        skillsWanted: {
          select: {
            id: true,
            name: true,
          }
        },
        availability: {
          select: {
            id: true,
            day: true,
          }
        }
      }
    });
    
    if (!user) {
      throw new HTTPException(404, { message: "User not found" });
    }
    
    return c.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    handleError(error, "Failed to get user information");
  }
});

export default auth;