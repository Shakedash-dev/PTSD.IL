import { Hono } from "hono";
import { reindexAll, reindexById } from "./lib/ingest";
import { handleChat } from "./lib/chat";

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

app.post("/reindex", async (c) => {
  const body = await c.req.json<{ scope: "all" } | { scope: "item"; itemId: string }>();
  const result = body.scope === "item"
    ? await reindexById(c.env, body.itemId)
    : await reindexAll(c.env);
  return c.json({ ok: true, ...result });
});

app.post("/chat", async (c) => {
  const body = await c.req.json<{ messages: { role: "user" | "assistant"; content: string }[]; lang: string; sessionId: string }>();
  return handleChat(c.env, body);
});

export default app;
