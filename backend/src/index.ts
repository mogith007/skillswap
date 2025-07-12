import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors';
import alpha from "./alpha/index.js";

const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}));

app.route("v1/", alpha);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
