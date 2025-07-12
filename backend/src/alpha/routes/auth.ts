import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { signToken } from "../utils/jwt.js";
import { validateBody } from "../middleware/validation.js";
import { registerSchema, loginSchema } from "../schemas/auth.js";
import { HTTP_STATUS } from "../config/constants.js";

const auth = new Hono();

auth.post("/register", validateBody(registerSchema), async (c) => {
  try {
    const { name, email, password, location, profilePhoto } = c.get("validatedData" as never) as never;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendError(c, "User already exists with this email", HTTP_STATUS.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        location,
        profilePhoto,
      },
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        profilePhoto: true,
        profileType: true,
        createdAt: true,
      },
    });

    const token = signToken({ userId: user.id, email: user.email });

    return sendSuccess(c, { user, token }, "User registered successfully", HTTP_STATUS.CREATED);
  } catch (error) {
    console.error("Registration error:", error);
    return sendError(c, "Registration failed", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

auth.post("/login", validateBody(loginSchema), async (c) => {
  try {
    const { email, password } = c.get("validatedData" as never) as never;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return sendError(c, "Invalid credentials", HTTP_STATUS.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return sendError(c, "Invalid credentials", HTTP_STATUS.UNAUTHORIZED);
    }

    const token = signToken({ userId: user.id, email: user.email });

    const { password: _, ...userWithoutPassword } = user;

    return sendSuccess(c, { user: userWithoutPassword, token }, "Login successful");
  } catch (error) {
    console.error("Login error:", error);
    return sendError(c, "Login failed", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default auth;
