import { Hono } from "hono";
import { HTTP_STATUS } from "./config/constants.js";
import { sendError } from "./utils/response.js";
import auth from "./routes/auth.js";
import user from "./routes/user.js";
import swap from "./routes/swap.js";
import skill from "./routes/skill.js";
import admin from "./routes/admin.js";
import rating from "./routes/rating.js";

const alpha = new Hono();

alpha.route("auth/", auth);
alpha.route("user/", user);
alpha.route("swap/", swap);
alpha.route("skill/", skill);
alpha.route("rating/", rating);
alpha.route("admin/", admin);

alpha.notFound((c) => {
  return sendError(c, "Route not found", HTTP_STATUS.NOT_FOUND);
});

export default alpha;
