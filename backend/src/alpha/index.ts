import { Hono } from "hono";
import auth from "./auth.js";

const alpha = new Hono();

alpha.route("auth/", auth);


export default alpha;