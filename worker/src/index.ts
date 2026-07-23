import { Hono } from "hono";
import { cors } from "hono/cors";
import { reindexAll, reindexById } from "./lib/ingest";
import { handleChat } from "./lib/chat";
import { verifyAdmin } from "./lib/auth";
import { checkLimit } from "./lib/ratelimit";

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

app.use("*", async (c, next) => {
  const mw = cors({
    origin: c.env.SITE_ORIGIN,
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  });
  return mw(c, next);
});

app.get("/health", (c) => c.json({ ok: true }));

app.post("/reindex", async (c) => {
  if (!(await verifyAdmin(c.env, c.req.header("Authorization") ?? null))) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const body = await c.req.json<{ scope: "all" } | { scope: "item"; itemId: string }>();
  const result = body.scope === "item"
    ? await reindexById(c.env, body.itemId)
    : await reindexAll(c.env);
  return c.json({ ok: true, ...result });
});

app.post("/chat", async (c) => {
  const body = await c.req.json<{ messages: { role: "user" | "assistant"; content: string }[]; lang: string; sessionId: string }>();
  if (!(await checkLimit(c.env, body.sessionId))) return c.json({ error: "rate_limited" }, 429);
  return handleChat(c.env, body);
});

export default app;
