import { Hono } from "hono";
import { cors } from "hono/cors";
import { reindexAll, reindexById } from "./lib/ingest";
import { handleChat } from "./lib/chat";
import { verifyAdmin, verifyAdminCached, tokenHash } from "./lib/auth";
import { checkLimit } from "./lib/ratelimit";
import { translate, validateTranslateRequest } from "./lib/translate";
import { parseArea } from "./lib/prompt";

export type Env = {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  RL: KVNamespace;
  SITE_ORIGIN: string;
  API_BASE: string;
  GEMINI_MODEL: string;
  GEMINI_API_KEY: string;
  ADMIN_VERIFY_URL: string;
  TRANSLATE_MODEL?: string;
  QA_STRONG?: string; // playbook "follow it" cosine threshold, default 0.80
  QA_WEAK?: string; // playbook "possibly relevant" threshold, default 0.72
  QA_INDEX_KEY?: string; // KV key of the playbook index, default qa:index:v1 (staging sets its own)
};

// Per admin token. One Hebrew save sends 4 requests (one per target language),
// so this is ~60 saved rows an hour.
const TRANSLATE_LIMIT = 240;

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  const mw = cors({
    origin: c.env.SITE_ORIGIN.split(",").map((s) => s.trim()),
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
  let body: { scope: "all" } | { scope: "item"; itemId: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  try {
    const result = body.scope === "item"
      ? await reindexById(c.env, body.itemId)
      : await reindexAll(c.env);
    return c.json({ ok: true, ...result });
  } catch (e) {
    return c.json({ error: "reindex_failed", message: (e as Error).message }, 500);
  }
});

app.post("/translate", async (c) => {
  const auth = c.req.header("Authorization") ?? null;
  if (!(await verifyAdminCached(c.env, auth))) return c.json({ error: "unauthorized" }, 401);
  if (!(await checkLimit(c.env, `tr:${await tokenHash(auth!)}`, TRANSLATE_LIMIT, 3600))) {
    return c.json({ error: "rate_limited" }, 429);
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  const v = validateTranslateRequest(body);
  if (!v.ok) return c.json({ error: v.error }, v.status);
  try {
    return c.json(await translate(c.env, v.req));
  } catch (e) {
    return c.json({ error: "translate_failed", message: (e as Error).message }, 502);
  }
});

app.post("/chat", async (c) => {
  const body = await c.req.json<{ messages: { role: "user" | "assistant"; content: string }[]; lang: string; sessionId: string; area?: unknown }>();
  if (!(await checkLimit(c.env, body.sessionId))) return c.json({ error: "rate_limited" }, 429);
  // `area` is optional (older clients, the mobile app): unknown values are dropped.
  return handleChat(c.env, { ...body, area: parseArea(body.area) });
});

export default app;
