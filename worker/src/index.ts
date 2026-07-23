import { Hono } from "hono";

export type Env = {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  RL: KVNamespace;
  SITE_ORIGIN: string;
  API_BASE: string;
  GEMINI_MODEL: string;
  GEMINI_API_KEY: string;
  ADMIN_VERIFY_URL: string;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) => c.json({ ok: true }));

export default app;
