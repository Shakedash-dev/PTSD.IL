# RAG Chatbot Worker - Implementation Plan (1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Cloudflare Worker that ingests the site's content into a vector store and serves grounded, cited, streamed chat answers with a deterministic crisis layer and an admin-gated reindex endpoint.

**Architecture:** A single Cloudflare Worker (Hono router) with two routes. `POST /chat` (public, rate-limited) runs crisis-check → embed → Vectorize retrieval → Gemini Flash streaming, returning SSE frames. `POST /reindex` (admin-JWT gated) pulls items from the NestJS API, chunks, embeds with Workers AI `bge-m3`, and upserts into Vectorize. Nothing container-based; everything is edge/serverless and always warm.

**Tech Stack:** Cloudflare Workers (TypeScript), Hono (router), Wrangler (deploy), plain Vitest in Node env (tests - the Hono app is exercised via `app.request(path, init, mockEnv)`; the Workers `workerd` runtime is not booted in tests because this sandbox cannot resolve the `ai`/`vectorize` wrapped bindings locally), Cloudflare Vectorize, Workers AI (`@cf/baai/bge-m3`), Google Gemini Flash (`streamGenerateContent` SSE).

## Global Constraints

- Language: TypeScript, ESM. Node not assumed - Workers runtime only.
- Embedder is `@cf/baai/bge-m3`, **1024 dims**, cosine. The **same** model embeds ingest chunks and queries.
- Vectorize index name: `ptsd-chatbot`. Metric `cosine`, dimensions `1024`.
- **Store nothing.** No request/response bodies persisted or logged. Error logs must not contain message text.
- **Grounded only.** If retrieval returns nothing above threshold, refuse gently - never answer ungrounded.
- Crisis line is **ERAN, phone `1201`**; the Worker emits a `crisis` SSE frame carrying `lang` only - the localized text lives in the frontend i18n (`eran_link`/`eran_phone`).
- CORS: allow only the site origin (`SITE_ORIGIN` var).
- Secrets (`GEMINI_API_KEY`) are Wrangler secrets, never committed.
- Project lives in a new dir `worker/` at repo root (sibling to `src/`), with its own `package.json`.
- Supported langs: `he`, `ar`, `en`, `ru`, `fr`.

---

### Task 1: Scaffold the Worker project

**Files:**
- Create: `worker/package.json`
- Create: `worker/tsconfig.json`
- Create: `worker/wrangler.toml`
- Create: `worker/vitest.config.ts`
- Create: `worker/src/index.ts`
- Test: `worker/test/health.test.ts`

**Interfaces:**
- Produces: the Hono `app` default-exported from `src/index.ts`; `GET /health` → `200 {"ok":true}`.

- [ ] **Step 1: Create `worker/package.json`**

```json
{
  "name": "ptsd-chatbot-worker",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run"
  },
  "dependencies": {
    "hono": "^4.6.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20260101.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0",
    "wrangler": "^3.90.0"
  }
}
```

- [ ] **Step 2: Create `worker/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "lib": ["es2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Create `worker/wrangler.toml`** (bindings referenced by later tasks)

```toml
name = "ptsd-chatbot-worker"
main = "src/index.ts"
compatibility_date = "2024-12-30"
compatibility_flags = ["nodejs_compat"]

[vars]
SITE_ORIGIN = "https://ptsd.il"
API_BASE = "https://ptsd-il-api.onrender.com/api"
GEMINI_MODEL = "gemini-flash-latest"
ADMIN_VERIFY_URL = "https://ptsd-il-api.onrender.com/api/admin/whoami"

[ai]
binding = "AI"

[[vectorize]]
binding = "VECTORIZE"
index_name = "ptsd-chatbot"

[[kv_namespaces]]
binding = "RL"
id = "REPLACE_WITH_KV_ID"
```

- [ ] **Step 4: Create `worker/vitest.config.ts`**

Plain Vitest (Node env) - **not** `@cloudflare/vitest-pool-workers`. The local `workerd` in this sandbox cannot resolve the `ai`/`vectorize` wrapped bindings, so we do not boot it in tests. The Worker's logic is pure functions with mocked bindings, and the Hono app is exercised via `app.request(path, init, mockEnv)`; Node 24 provides `fetch`/`ReadableStream`/`TextDecoderStream`. `wrangler.toml` keeps the real bindings for deploy only.

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", globals: true },
});
```

- [ ] **Step 5: Write the failing test `worker/test/health.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import app from "../src/index";

describe("health", () => {
  it("GET /health returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `cd worker && npm install && npm test`
Expected: FAIL - cannot resolve `../src/index`.

- [ ] **Step 7: Create `worker/src/index.ts`**

```typescript
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
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `cd worker && npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add worker/package.json worker/tsconfig.json worker/wrangler.toml worker/vitest.config.ts worker/src/index.ts worker/test/health.test.ts
git commit -m "feat(worker): scaffold chatbot worker with /health"
```

---

### Task 2: Content extraction (`articles.content` JSON → text)

**Files:**
- Create: `worker/src/lib/content.ts`
- Test: `worker/test/content.test.ts`

**Interfaces:**
- Produces: `type Item` (the raw API row) and `extractText(item: Item): { title: string; text: string }`. Walks the parsed `content` JSON and concatenates all string leaves (Markdown/plain), skipping keys that are URLs/ids. Consumed by ingestion (Task 7).

- [ ] **Step 1: Write the failing test `worker/test/content.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { extractText, type Item } from "../src/lib/content";

const faq: Item = {
  id: "a1", groupId: "g1", type: "faq", langId: "he",
  title: "מה זה פלאשבק?",
  content: JSON.stringify({ question: "מה זה פלאשבק?", answer: "**חוויה חוזרת** של הטראומה." }),
};

describe("extractText", () => {
  it("concatenates title and string leaves of parsed content", () => {
    const { title, text } = extractText(faq);
    expect(title).toBe("מה זה פלאשבק?");
    expect(text).toContain("חוויה חוזרת");
    expect(text).toContain("מה זה פלאשבק?");
  });

  it("skips url/id-like leaves and non-string values", () => {
    const item: Item = {
      id: "a2", groupId: "g2", type: "source", langId: "he", title: "DSM-5",
      content: JSON.stringify({ note: "מקור מרכזי", url: "https://x/y", year: 2013, ios_url: "z" }),
    };
    const { text } = extractText(item);
    expect(text).toContain("מקור מרכזי");
    expect(text).not.toContain("https://x/y");
    expect(text).not.toContain("2013");
  });

  it("returns title-only text when content is empty/unparseable", () => {
    const item: Item = { id: "a3", groupId: "g3", type: "story", langId: "he", title: "סיפור", content: "" };
    const { text } = extractText(item);
    expect(text.trim()).toBe("סיפור");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- content`
Expected: FAIL - cannot resolve `../src/lib/content`.

- [ ] **Step 3: Create `worker/src/lib/content.ts`**

```typescript
export type Item = {
  id: string;
  groupId: string;
  type: string;
  langId: string;
  title: string;
  content: string; // JSON string, may be empty
};

// Leaf keys that carry URLs/ids/non-prose - never index as text.
const SKIP_KEYS = new Set([
  "url", "ios_url", "android_url", "cta_url", "contact_url", "link", "links",
  "id", "groupId", "parentId", "authorId", "image", "icon", "slug", "year",
]);

function walk(node: unknown, key: string, out: string[]): void {
  if (typeof node === "string") {
    const v = node.trim();
    if (!v || SKIP_KEYS.has(key) || /^https?:\/\//i.test(v)) return;
    out.push(v);
  } else if (Array.isArray(node)) {
    for (const child of node) walk(child, key, out);
  } else if (node && typeof node === "object") {
    for (const [k, child] of Object.entries(node)) {
      if (SKIP_KEYS.has(k)) continue;
      walk(child, k, out);
    }
  }
}

export function extractText(item: Item): { title: string; text: string } {
  const parts: string[] = [item.title.trim()].filter(Boolean);
  if (item.content) {
    try {
      walk(JSON.parse(item.content), "", parts);
    } catch {
      // unparseable content → title only
    }
  }
  // Dedupe consecutive duplicates (title often repeats inside content).
  const deduped = parts.filter((p, i) => p !== parts[i - 1]);
  return { title: item.title.trim(), text: deduped.join("\n\n") };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd worker && npm test -- content`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/src/lib/content.ts worker/test/content.test.ts
git commit -m "feat(worker): extract indexable text from article content JSON"
```

---

### Task 3: Chunking

**Files:**
- Create: `worker/src/lib/chunk.ts`
- Test: `worker/test/chunk.test.ts`

**Interfaces:**
- Consumes: `extractText` output.
- Produces: `type Chunk = { text: string; index: number }` and `chunk(text: string, opts?: { max?: number; overlap?: number }): Chunk[]`. `max`/`overlap` are in characters (proxy for tokens; ~4 chars/token → default `max=1600`≈400 tok, `overlap=200`). Splits on paragraph boundaries, packing paragraphs up to `max`, with `overlap` char carryover. Consumed by ingestion (Task 7).

- [ ] **Step 1: Write the failing test `worker/test/chunk.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { chunk } from "../src/lib/chunk";

describe("chunk", () => {
  it("returns one chunk for short text", () => {
    const out = chunk("short text");
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ text: "short text", index: 0 });
  });

  it("splits long text into multiple ordered chunks under max", () => {
    const para = "x".repeat(1000);
    const text = [para, para, para].join("\n\n");
    const out = chunk(text, { max: 1600, overlap: 100 });
    expect(out.length).toBeGreaterThan(1);
    out.forEach((c, i) => expect(c.index).toBe(i));
    out.forEach((c) => expect(c.text.length).toBeLessThanOrEqual(1600 + 100));
  });

  it("never returns empty chunks", () => {
    const out = chunk("\n\n\n a \n\n\n");
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe("a");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- chunk`
Expected: FAIL - cannot resolve module.

- [ ] **Step 3: Create `worker/src/lib/chunk.ts`**

```typescript
export type Chunk = { text: string; index: number };

export function chunk(text: string, opts: { max?: number; overlap?: number } = {}): Chunk[] {
  const max = opts.max ?? 1600;
  const overlap = opts.overlap ?? 200;
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paras.length === 0) return [];

  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if (buf && buf.length + p.length + 2 > max) {
      chunks.push(buf);
      buf = buf.slice(Math.max(0, buf.length - overlap)); // carry overlap
    }
    buf = buf ? `${buf}\n\n${p}` : p;
    // Hard-split a single oversized paragraph.
    while (buf.length > max + overlap) {
      chunks.push(buf.slice(0, max));
      buf = buf.slice(max - overlap);
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.map((text, index) => ({ text, index }));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd worker && npm test -- chunk`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/src/lib/chunk.ts worker/test/chunk.test.ts
git commit -m "feat(worker): paragraph-aware text chunker"
```

---

### Task 4: NestJS API client (list published items)

**Files:**
- Create: `worker/src/lib/api.ts`
- Test: `worker/test/api.test.ts`

**Interfaces:**
- Consumes: `Item` from `content.ts`.
- Produces: `fetchAllItems(apiBase: string): Promise<Item[]>` and `fetchItem(apiBase: string, id: string): Promise<Item | null>`. Both filter to `isPublished`. `fetchAllItems` pulls `/articles` (all langs it returns) and normalizes rows to `Item`. Consumed by ingestion (Task 7).

> Confirm at build: exact `/articles` pagination and whether `langId` must be enumerated. This wrapper assumes `/articles` returns all published rows; if paginated, extend to follow pages. Tests mock `fetch`, so shape is pinned here.

- [ ] **Step 1: Write the failing test `worker/test/api.test.ts`**

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchAllItems } from "../src/lib/api";

afterEach(() => vi.restoreAllMocks());

describe("fetchAllItems", () => {
  it("normalizes and drops unpublished rows", async () => {
    const rows = [
      { id: "1", groupId: "g", type: "faq", langId: "he", title: "A", content: "{}", isPublished: true },
      { id: "2", groupId: "g", type: "faq", langId: "he", title: "B", content: "{}", isPublished: false },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(rows), { status: 200 }));
    const items = await fetchAllItems("https://api/x");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "1", type: "faq", title: "A" });
  });

  it("throws on non-200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 502 }));
    await expect(fetchAllItems("https://api/x")).rejects.toThrow(/502/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- api`
Expected: FAIL.

- [ ] **Step 3: Create `worker/src/lib/api.ts`**

```typescript
import type { Item } from "./content";

type Row = Partial<Item> & { isPublished?: boolean };

function normalize(r: Row): Item {
  return {
    id: String(r.id),
    groupId: String(r.groupId ?? r.id),
    type: String(r.type ?? "article"),
    langId: String(r.langId ?? "he"),
    title: String(r.title ?? ""),
    content: typeof r.content === "string" ? r.content : JSON.stringify(r.content ?? ""),
  };
}

async function getJson(url: string): Promise<Row[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status} for ${url}`);
  const data = await res.json();
  return Array.isArray(data) ? (data as Row[]) : ((data as { items?: Row[] }).items ?? []);
}

export async function fetchAllItems(apiBase: string): Promise<Item[]> {
  const rows = await getJson(`${apiBase}/articles`);
  return rows.filter((r) => r.isPublished !== false).map(normalize);
}

export async function fetchItem(apiBase: string, id: string): Promise<Item | null> {
  const res = await fetch(`${apiBase}/articles/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} for item ${id}`);
  const row = (await res.json()) as Row;
  if (row.isPublished === false) return null;
  return normalize(row);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd worker && npm test -- api`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/src/lib/api.ts worker/test/api.test.ts
git commit -m "feat(worker): NestJS API client for published items"
```

---

### Task 5: Embeddings wrapper (Workers AI bge-m3)

**Files:**
- Create: `worker/src/lib/embed.ts`
- Test: `worker/test/embed.test.ts`

**Interfaces:**
- Produces: `embed(ai: Ai, texts: string[]): Promise<number[][]>`. Calls `@cf/baai/bge-m3`, returns one 1024-dim vector per input. Consumed by ingestion (Task 7) and chat (Task 11).

> Confirm at build: the exact response field for `@cf/baai/bge-m3` on Workers AI. This wrapper reads `res.data` (array of vectors). If the live model returns a different field, change only this file.

- [ ] **Step 1: Write the failing test `worker/test/embed.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { embed } from "../src/lib/embed";

const fakeAI = {
  run: async (_model: string, _input: { text: string[] }) => ({ data: [[0.1, 0.2], [0.3, 0.4]] }),
} as unknown as Ai;

describe("embed", () => {
  it("returns one vector per input text", async () => {
    const out = await embed(fakeAI, ["a", "b"]);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual([0.1, 0.2]);
  });

  it("returns [] for empty input without calling the model", async () => {
    let called = false;
    const ai = { run: async () => { called = true; return { data: [] }; } } as unknown as Ai;
    expect(await embed(ai, [])).toEqual([]);
    expect(called).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- embed`
Expected: FAIL.

- [ ] **Step 3: Create `worker/src/lib/embed.ts`**

```typescript
const MODEL = "@cf/baai/bge-m3";

export async function embed(ai: Ai, texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = (await ai.run(MODEL, { text: texts })) as { data: number[][] };
  return res.data;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd worker && npm test -- embed`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/src/lib/embed.ts worker/test/embed.test.ts
git commit -m "feat(worker): bge-m3 embeddings wrapper"
```

---

### Task 6: Vectorize wrappers (upsert / delete / query)

**Files:**
- Create: `worker/src/lib/vector.ts`
- Test: `worker/test/vector.test.ts`

**Interfaces:**
- Consumes: `Chunk`, `Item`.
- Produces:
  - `type ChunkMeta = { itemId: string; groupId: string; type: string; langId: string; title: string; text: string; chunkIndex: number }`
  - `upsertItemChunks(index, itemId, vectors, metas)` - id scheme `${itemId}:${i}`.
  - `deleteItem(index, itemId, maxChunks?)` - deletes `${itemId}:0..maxChunks-1`.
  - `type Hit = { score: number; meta: ChunkMeta }`
  - `query(index, vector, topK): Promise<Hit[]>` - returns metadata.
  - Consumed by ingestion (Task 7) and chat (Task 11).

- [ ] **Step 1: Write the failing test `worker/test/vector.test.ts`**

```typescript
import { describe, it, expect, vi } from "vitest";
import { upsertItemChunks, query, deleteItem, type ChunkMeta } from "../src/lib/vector";

const meta: ChunkMeta = { itemId: "1", groupId: "g", type: "faq", langId: "he", title: "T", text: "hello", chunkIndex: 0 };

describe("vector", () => {
  it("upsert builds id-prefixed vectors with metadata", async () => {
    const upsert = vi.fn(async () => ({ mutationId: "m" }));
    const index = { upsert } as unknown as VectorizeIndex;
    await upsertItemChunks(index, "1", [[0.1, 0.2]], [meta]);
    expect(upsert).toHaveBeenCalledWith([{ id: "1:0", values: [0.1, 0.2], metadata: meta }]);
  });

  it("query maps matches to {score, meta}", async () => {
    const index = {
      query: vi.fn(async () => ({ matches: [{ score: 0.9, metadata: meta }] })),
    } as unknown as VectorizeIndex;
    const hits = await query(index, [0.1, 0.2], 5);
    expect(hits).toEqual([{ score: 0.9, meta }]);
  });

  it("deleteItem removes id-prefixed chunk ids", async () => {
    const deleteByIds = vi.fn(async () => ({ mutationId: "m" }));
    const index = { deleteByIds } as unknown as VectorizeIndex;
    await deleteItem(index, "1", 3);
    expect(deleteByIds).toHaveBeenCalledWith(["1:0", "1:1", "1:2"]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- vector`
Expected: FAIL.

- [ ] **Step 3: Create `worker/src/lib/vector.ts`**

```typescript
export type ChunkMeta = {
  itemId: string;
  groupId: string;
  type: string;
  langId: string;
  title: string;
  text: string;
  chunkIndex: number;
};

export type Hit = { score: number; meta: ChunkMeta };

export async function upsertItemChunks(
  index: VectorizeIndex,
  itemId: string,
  vectors: number[][],
  metas: ChunkMeta[],
): Promise<void> {
  const rows = vectors.map((values, i) => ({ id: `${itemId}:${i}`, values, metadata: metas[i] }));
  if (rows.length) await index.upsert(rows as unknown as VectorizeVector[]);
}

export async function deleteItem(index: VectorizeIndex, itemId: string, maxChunks = 64): Promise<void> {
  const ids = Array.from({ length: maxChunks }, (_, i) => `${itemId}:${i}`);
  await index.deleteByIds(ids);
}

export async function query(index: VectorizeIndex, vector: number[], topK: number): Promise<Hit[]> {
  const res = await index.query(vector, { topK, returnMetadata: "all" });
  return (res.matches ?? []).map((m) => ({ score: m.score, meta: m.metadata as unknown as ChunkMeta }));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd worker && npm test -- vector`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/src/lib/vector.ts worker/test/vector.test.ts
git commit -m "feat(worker): Vectorize upsert/query/delete wrappers"
```

---

### Task 7: Ingestion orchestrator + unauthenticated `/reindex` (auth added in Task 12)

**Files:**
- Create: `worker/src/lib/ingest.ts`
- Modify: `worker/src/index.ts`
- Test: `worker/test/ingest.test.ts`

**Interfaces:**
- Consumes: `fetchAllItems`/`fetchItem` (Task 4), `extractText` (Task 2), `chunk` (Task 3), `embed` (Task 5), `upsertItemChunks`/`deleteItem` (Task 6).
- Produces: `reindexItem(env, item)`, `reindexAll(env)`, both returning `{ upserted: number }`. Route `POST /reindex` accepting `{ scope:"all" } | { scope:"item", itemId }`.

- [ ] **Step 1: Write the failing test `worker/test/ingest.test.ts`**

```typescript
import { describe, it, expect, vi } from "vitest";
import { reindexItem } from "../src/lib/ingest";
import type { Item } from "../src/lib/content";

const item: Item = {
  id: "1", groupId: "g", type: "faq", langId: "he", title: "כותרת",
  content: JSON.stringify({ answer: "טקסט תשובה מספיק ארוך כדי להוות צ'אנק." }),
};

describe("reindexItem", () => {
  it("embeds chunks and upserts them with metadata", async () => {
    const upsert = vi.fn(async () => ({ mutationId: "m" }));
    const env = {
      AI: { run: async (_m: string, i: { text: string[] }) => ({ data: i.text.map(() => [0.1, 0.2]) }) },
      VECTORIZE: { upsert },
    } as unknown as import("../src/index").Env;

    const out = await reindexItem(env, item);
    expect(out.upserted).toBeGreaterThan(0);
    const call = upsert.mock.calls[0][0] as Array<{ id: string; metadata: { itemId: string } }>;
    expect(call[0].id).toBe("1:0");
    expect(call[0].metadata.itemId).toBe("1");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- ingest`
Expected: FAIL.

- [ ] **Step 3: Create `worker/src/lib/ingest.ts`**

```typescript
import type { Env } from "../index";
import type { Item } from "./content";
import { extractText } from "./content";
import { chunk } from "./chunk";
import { embed } from "./embed";
import { upsertItemChunks, deleteItem, type ChunkMeta } from "./vector";
import { fetchAllItems, fetchItem } from "./api";

export async function reindexItem(env: Env, item: Item): Promise<{ upserted: number }> {
  const { title, text } = extractText(item);
  const chunks = chunk(text);
  if (chunks.length === 0) {
    await deleteItem(env.VECTORIZE, item.id);
    return { upserted: 0 };
  }
  const vectors = await embed(env.AI, chunks.map((c) => c.text));
  const metas: ChunkMeta[] = chunks.map((c) => ({
    itemId: item.id, groupId: item.groupId, type: item.type,
    langId: item.langId, title, text: c.text, chunkIndex: c.index,
  }));
  await deleteItem(env.VECTORIZE, item.id); // clear stale chunks first
  await upsertItemChunks(env.VECTORIZE, item.id, vectors, metas);
  return { upserted: chunks.length };
}

export async function reindexAll(env: Env): Promise<{ upserted: number }> {
  const items = await fetchAllItems(env.API_BASE);
  let upserted = 0;
  for (const item of items) upserted += (await reindexItem(env, item)).upserted;
  return { upserted };
}

export async function reindexById(env: Env, itemId: string): Promise<{ upserted: number }> {
  const item = await fetchItem(env.API_BASE, itemId);
  if (!item) {
    await deleteItem(env.VECTORIZE, itemId);
    return { upserted: 0 };
  }
  return reindexItem(env, item);
}
```

- [ ] **Step 4: Add the `/reindex` route in `worker/src/index.ts`** (append before `export default app;`)

```typescript
import { reindexAll, reindexById } from "./lib/ingest";

app.post("/reindex", async (c) => {
  const body = await c.req.json<{ scope: "all" } | { scope: "item"; itemId: string }>();
  const result = body.scope === "item"
    ? await reindexById(c.env, body.itemId)
    : await reindexAll(c.env);
  return c.json({ ok: true, ...result });
});
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd worker && npm test -- ingest`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add worker/src/lib/ingest.ts worker/src/index.ts worker/test/ingest.test.ts
git commit -m "feat(worker): ingestion orchestrator and /reindex route"
```

---

### Task 8: Crisis detection (per-language)

**Files:**
- Create: `worker/src/lib/crisis.ts`
- Test: `worker/test/crisis.test.ts`

**Interfaces:**
- Produces: `detectCrisis(text: string): boolean`. Language-agnostic scan over a combined multi-language phrase list (self-harm / suicide / acute danger) using normalized substring match. Consumed by chat (Task 11). Fails safe (a false positive only shows ERAN, which is low-harm).

> The phrase lists below are a starting set per language and must be reviewed by a domain expert before launch. Matching is case-insensitive and diacritic-tolerant.

- [ ] **Step 1: Write the failing test `worker/test/crisis.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { detectCrisis } from "../src/lib/crisis";

describe("detectCrisis", () => {
  it("flags Hebrew self-harm phrasing", () => {
    expect(detectCrisis("אני רוצה לשים סוף לחיים שלי")).toBe(true);
  });
  it("flags English suicidal phrasing", () => {
    expect(detectCrisis("I want to kill myself")).toBe(true);
  });
  it("does not flag ordinary questions", () => {
    expect(detectCrisis("What are my rights after a work injury?")).toBe(false);
    expect(detectCrisis("מהן הזכויות שלי?")).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- crisis`
Expected: FAIL.

- [ ] **Step 3: Create `worker/src/lib/crisis.ts`**

```typescript
// Starter phrase lists - REVIEW WITH A CLINICAL EXPERT before launch.
const PHRASES: string[] = [
  // Hebrew
  "לשים סוף לחיים", "לשים סוף לחיי", "לא רוצה לחיות", "לסיים את החיים",
  "לפגוע בעצמי", "לאבד את עצמי לדעת", "אובדני", "לְהִתְאַבֵּד", "להתאבד",
  // Arabic
  "أريد أن أنهي حياتي", "أؤذي نفسي", "الانتحار", "أنهي حياتي",
  // English
  "kill myself", "end my life", "want to die", "suicide", "hurt myself", "self harm", "self-harm",
  // Russian
  "покончить с собой", "не хочу жить", "убить себя", "суицид",
  // French
  "en finir avec la vie", "me faire du mal", "suicide", "envie de mourir",
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[֑-ׇً-ْ]/g, "");
}

const NEEDLES = PHRASES.map(normalize);

export function detectCrisis(text: string): boolean {
  const hay = normalize(text);
  return NEEDLES.some((n) => hay.includes(n));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd worker && npm test -- crisis`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/src/lib/crisis.ts worker/test/crisis.test.ts
git commit -m "feat(worker): deterministic multi-language crisis detection"
```

---

### Task 9: Prompt builder

**Files:**
- Create: `worker/src/lib/prompt.ts`
- Test: `worker/test/prompt.test.ts`

**Interfaces:**
- Consumes: `Hit` (Task 6), a `Msg = { role: "user"|"assistant"; content: string }` list, and `lang`.
- Produces: `buildContents(msgs, hits, lang): { systemInstruction: { parts: [{ text }] }; contents: Array<{ role: "user"|"model"; parts: [{ text }] }> }` in Gemini request shape. Numbers hits `[1..k]`, embeds grounding + no-medical-advice + citation (`[[n]]`) + output-language rules. Consumed by Gemini client (Task 10) and chat (Task 11).

- [ ] **Step 1: Write the failing test `worker/test/prompt.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { buildContents } from "../src/lib/prompt";
import type { Hit } from "../src/lib/vector";

const hit = (text: string, i: number): Hit => ({
  score: 0.9,
  meta: { itemId: `${i}`, groupId: "g", type: "faq", langId: "he", title: `T${i}`, text, chunkIndex: 0 },
});

describe("buildContents", () => {
  it("numbers sources and includes grounding + citation rules", () => {
    const out = buildContents([{ role: "user", content: "מה זה?" }], [hit("aaa", 1), hit("bbb", 2)], "he");
    const sys = out.systemInstruction.parts[0].text;
    expect(sys).toMatch(/\[\[n\]\]/);
    expect(sys).toMatch(/only.*sources|רק.*מקורות/i);
    const ctx = out.contents[0].parts[0].text;
    expect(ctx).toContain("[1]");
    expect(ctx).toContain("aaa");
    expect(ctx).toContain("[2]");
  });

  it("maps assistant role to model", () => {
    const out = buildContents(
      [{ role: "user", content: "a" }, { role: "assistant", content: "b" }, { role: "user", content: "c" }],
      [hit("x", 1)], "en",
    );
    const roles = out.contents.map((c) => c.role);
    expect(roles).toContain("model");
    expect(roles[roles.length - 1]).toBe("user");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- prompt`
Expected: FAIL.

- [ ] **Step 3: Create `worker/src/lib/prompt.ts`**

```typescript
import type { Hit } from "./vector";

export type Msg = { role: "user" | "assistant"; content: string };

const LANG_NAME: Record<string, string> = {
  he: "Hebrew", ar: "Arabic", en: "English", ru: "Russian", fr: "French",
};

function system(lang: string): string {
  const langName = LANG_NAME[lang] ?? "the user's language";
  return [
    "You are a warm, supportive assistant for a post-trauma (PTSD) support website.",
    "Speak in plain, everyday, non-clinical language. Be kind and concise.",
    "Answer ONLY using the numbered SOURCES provided. If the sources do not cover the question,",
    "say you can only help with topics covered on this site and do not invent an answer.",
    "Never give medical, clinical, diagnostic, or treatment advice. Inform and refer to the site's",
    "resources and to professionals instead.",
    "After each sentence that uses a source, append the supporting source number(s) as [[n]]",
    "(for example: [[1]] or [[2]][[3]]). Do not add a separate sources list.",
    `Always answer in ${langName}, translating source material if needed.`,
    "If the user expresses distress or thoughts of self-harm, gently encourage them to reach out",
    "to the ERAN helpline (1201) and to people they trust.",
  ].join(" ");
}

function contextBlock(hits: Hit[]): string {
  const src = hits.map((h, i) => `[${i + 1}] (${h.meta.title})\n${h.meta.text}`).join("\n\n");
  return `SOURCES:\n${src}`;
}

export function buildContents(msgs: Msg[], hits: Hit[], lang: string) {
  const history = msgs.map((m) => ({
    role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
    parts: [{ text: m.content }],
  }));
  // Prepend the numbered sources as context to the latest user turn.
  const contents = [{ role: "user" as const, parts: [{ text: contextBlock(hits) }] }, ...history];
  return { systemInstruction: { parts: [{ text: system(lang) }] }, contents };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd worker && npm test -- prompt`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/src/lib/prompt.ts worker/test/prompt.test.ts
git commit -m "feat(worker): grounded prompt builder with citation rules"
```

---

### Task 10: Gemini streaming client

**Files:**
- Create: `worker/src/lib/gemini.ts`
- Test: `worker/test/gemini.test.ts`

**Interfaces:**
- Consumes: `buildContents` output, `env.GEMINI_MODEL`, `env.GEMINI_API_KEY`.
- Produces: `streamGemini(env, payload): AsyncGenerator<string>` yielding text deltas, parsing the `alt=sse` `streamGenerateContent` response (`candidates[0].content.parts[].text`). Consumed by chat (Task 11).

- [ ] **Step 1: Write the failing test `worker/test/gemini.test.ts`**

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";
import { streamGemini } from "../src/lib/gemini";

afterEach(() => vi.restoreAllMocks());

function sseBody(lines: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(ctrl) { for (const l of lines) ctrl.enqueue(enc.encode(l)); ctrl.close(); },
  });
}

describe("streamGemini", () => {
  it("yields text deltas from SSE data frames", async () => {
    const frames = [
      `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "Hel" }] } }] })}\n\n`,
      `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "lo" }] } }] })}\n\n`,
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(sseBody(frames), { status: 200 }));
    const env = { GEMINI_MODEL: "gemini-flash-latest", GEMINI_API_KEY: "k" } as any;
    const out: string[] = [];
    for await (const t of streamGemini(env, { systemInstruction: { parts: [{ text: "s" }] }, contents: [] })) out.push(t);
    expect(out.join("")).toBe("Hello");
  });

  it("throws on non-200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("bad", { status: 400 }));
    const env = { GEMINI_MODEL: "m", GEMINI_API_KEY: "k" } as any;
    const gen = streamGemini(env, { systemInstruction: { parts: [{ text: "s" }] }, contents: [] });
    await expect(gen.next()).rejects.toThrow(/400/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- gemini`
Expected: FAIL.

- [ ] **Step 3: Create `worker/src/lib/gemini.ts`**

```typescript
import type { Env } from "../index";

type Payload = {
  systemInstruction: { parts: { text: string }[] };
  contents: { role: "user" | "model"; parts: { text: string }[] }[];
};

export async function* streamGemini(env: Env, payload: Payload): AsyncGenerator<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !res.body) throw new Error(`Gemini ${res.status}`);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      if (!json || json === "[DONE]") continue;
      try {
        const obj = JSON.parse(json) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        for (const p of obj.candidates?.[0]?.content?.parts ?? []) if (p.text) yield p.text;
      } catch { /* ignore partial frame */ }
    }
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd worker && npm test -- gemini`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/src/lib/gemini.ts worker/test/gemini.test.ts
git commit -m "feat(worker): Gemini Flash SSE streaming client"
```

---

### Task 11: `/chat` handler (crisis → retrieve → generate → SSE)

**Files:**
- Create: `worker/src/lib/chat.ts`
- Modify: `worker/src/index.ts`
- Test: `worker/test/chat.test.ts`

**Interfaces:**
- Consumes: `detectCrisis` (8), `embed` (5), `query` (6), `buildContents` (9), `streamGemini` (10).
- Produces: `handleChat(env, body): Response` returning `text/event-stream` with frames `crisis`, `token`, `sources`, `done`, `error`. `RETRIEVAL_MIN_SCORE = 0.4`; empty/low retrieval → a grounded-refusal `token` + `done`. Route `POST /chat`.
- Request body: `{ messages: Msg[]; lang: string; sessionId: string }`.

- [ ] **Step 1: Write the failing test `worker/test/chat.test.ts`**

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";
import { handleChat } from "../src/lib/chat";

afterEach(() => vi.restoreAllMocks());

async function readSSE(res: Response): Promise<string> {
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let out = "";
  for (;;) { const { value, done } = await reader.read(); if (done) break; out += value; }
  return out;
}

const baseEnv = () => ({
  AI: { run: async (_m: string, i: { text: string[] }) => ({ data: i.text.map(() => [0.1, 0.2]) }) },
  VECTORIZE: {
    query: async () => ({ matches: [{ score: 0.9, metadata: { itemId: "1", groupId: "g", type: "faq", langId: "he", title: "T", text: "grounded fact", chunkIndex: 0 } }] }),
  },
  GEMINI_MODEL: "m", GEMINI_API_KEY: "k",
}) as any;

function geminiSSE(text: string) {
  const enc = new TextEncoder();
  const frame = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`;
  return new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode(frame)); c.close(); } }), { status: 200 });
}

describe("handleChat", () => {
  it("emits crisis frame for distress messages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(geminiSSE("hang in there [[1]]"));
    const res = await handleChat(baseEnv(), { messages: [{ role: "user", content: "I want to kill myself" }], lang: "en", sessionId: "s" });
    const body = await readSSE(res);
    expect(body).toContain("event: crisis");
    expect(body).toContain("event: token");
    expect(body).toContain("event: sources");
    expect(body).toContain("event: done");
  });

  it("refuses when retrieval is empty", async () => {
    const env = baseEnv();
    env.VECTORIZE.query = async () => ({ matches: [] });
    const res = await handleChat(env, { messages: [{ role: "user", content: "unrelated" }], lang: "en", sessionId: "s" });
    const body = await readSSE(res);
    expect(body).toContain("event: token");
    expect(body).not.toContain("event: sources");
    expect(body).toContain("event: done");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- chat`
Expected: FAIL.

- [ ] **Step 3: Create `worker/src/lib/chat.ts`**

```typescript
import type { Env } from "../index";
import type { Msg } from "./prompt";
import { detectCrisis } from "./crisis";
import { embed } from "./embed";
import { query } from "./vector";
import { buildContents } from "./prompt";
import { streamGemini } from "./gemini";

const RETRIEVAL_MIN_SCORE = 0.4;
const TOP_K = 8;

const REFUSAL: Record<string, string> = {
  he: "אני יכול/ה לעזור רק בנושאים שמופיעים באתר. אפשר לנסח מחדש?",
  ar: "يمكنني المساعدة فقط في المواضيع الموجودة على هذا الموقع.",
  en: "I can only help with topics covered on this site. Could you rephrase?",
  ru: "Я могу помочь только по темам, представленным на этом сайте.",
  fr: "Je ne peux aider que sur les sujets présents sur ce site.",
};

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function handleChat(env: Env, body: { messages: Msg[]; lang: string; sessionId: string }): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const send = (event: string, data: unknown) => ctrl.enqueue(enc.encode(sse(event, data)));
      try {
        const last = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
        if (detectCrisis(last)) send("crisis", { lang: body.lang });

        const [qv] = await embed(env.AI, [last]);
        const hits = (await query(env.VECTORIZE, qv, TOP_K)).filter((h) => h.score >= RETRIEVAL_MIN_SCORE);

        if (hits.length === 0) {
          send("token", { text: REFUSAL[body.lang] ?? REFUSAL.en });
          send("done", {});
          ctrl.close();
          return;
        }

        const payload = buildContents(body.messages, hits, body.lang);
        for await (const delta of streamGemini(env, payload)) send("token", { text: delta });

        send("sources", hits.map((h, i) => ({
          n: i + 1, itemId: h.meta.itemId, groupId: h.meta.groupId,
          type: h.meta.type, langId: h.meta.langId, title: h.meta.title,
        })));
        send("done", {});
      } catch (e) {
        send("error", { message: (e as Error).message });
      } finally {
        ctrl.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
  });
}
```

- [ ] **Step 4: Add the `/chat` route in `worker/src/index.ts`** (append before `export default app;`)

```typescript
import { handleChat } from "./lib/chat";

app.post("/chat", async (c) => {
  const body = await c.req.json<{ messages: { role: "user" | "assistant"; content: string }[]; lang: string; sessionId: string }>();
  return handleChat(c.env, body);
});
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd worker && npm test -- chat`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add worker/src/lib/chat.ts worker/src/index.ts worker/test/chat.test.ts
git commit -m "feat(worker): /chat SSE handler with grounding, crisis, citations"
```

---

### Task 12: Admin-JWT gate on `/reindex`

**Files:**
- Create: `worker/src/lib/auth.ts`
- Modify: `worker/src/index.ts`
- Test: `worker/test/auth.test.ts`

**Interfaces:**
- Consumes: `env.ADMIN_VERIFY_URL`, the `Authorization` header.
- Produces: `verifyAdmin(env, authHeader): Promise<boolean>` - forwards the bearer token to an authenticated `/api/admin/*` endpoint; `2xx` → admin. Middleware applied to `/reindex` returns `401` when missing/invalid.

> Confirm at build (spec §18): either a cheap authenticated `/api/admin/*` endpoint exists to verify against (`ADMIN_VERIFY_URL`), or switch this file to local JWT signature+role verification using the backend key.

- [ ] **Step 1: Write the failing test `worker/test/auth.test.ts`**

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";
import { verifyAdmin } from "../src/lib/auth";

afterEach(() => vi.restoreAllMocks());
const env = { ADMIN_VERIFY_URL: "https://api/admin/whoami" } as any;

describe("verifyAdmin", () => {
  it("false when header missing", async () => {
    expect(await verifyAdmin(env, null)).toBe(false);
  });
  it("true when backend accepts the token", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    expect(await verifyAdmin(env, "Bearer good")).toBe(true);
    expect(spy.mock.calls[0][1]).toMatchObject({ headers: { Authorization: "Bearer good" } });
  });
  it("false when backend rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("no", { status: 401 }));
    expect(await verifyAdmin(env, "Bearer bad")).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- auth`
Expected: FAIL.

- [ ] **Step 3: Create `worker/src/lib/auth.ts`**

```typescript
import type { Env } from "../index";

export async function verifyAdmin(env: Env, authHeader: string | null): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  try {
    const res = await fetch(env.ADMIN_VERIFY_URL, { headers: { Authorization: authHeader } });
    return res.ok;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Guard `/reindex` in `worker/src/index.ts`** - replace the `/reindex` handler body's first line with an auth check:

```typescript
import { verifyAdmin } from "./lib/auth";

app.post("/reindex", async (c) => {
  if (!(await verifyAdmin(c.env, c.req.header("Authorization") ?? null))) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const body = await c.req.json<{ scope: "all" } | { scope: "item"; itemId: string }>();
  const result = body.scope === "item" ? await reindexById(c.env, body.itemId) : await reindexAll(c.env);
  return c.json({ ok: true, ...result });
});
```

- [ ] **Step 5: Add an auth integration test `worker/test/reindex-auth.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import app from "../src/index";

describe("/reindex auth", () => {
  it("401 without Authorization", async () => {
    const env = { ADMIN_VERIFY_URL: "https://api/admin/whoami", SITE_ORIGIN: "https://x" } as any;
    const res = await app.request(
      "/reindex",
      { method: "POST", body: JSON.stringify({ scope: "all" }), headers: { "content-type": "application/json" } },
      env,
    );
    expect(res.status).toBe(401);
  });
});
```

> `verifyAdmin` returns `false` for a missing `Bearer` header without any network call, so this test needs no fetch mock.

- [ ] **Step 6: Run to verify both pass**

Run: `cd worker && npm test -- auth reindex-auth`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add worker/src/lib/auth.ts worker/src/index.ts worker/test/auth.test.ts worker/test/reindex-auth.test.ts
git commit -m "feat(worker): admin-JWT gate on /reindex"
```

---

### Task 13: Per-session rate limit + CORS on `/chat`

**Files:**
- Create: `worker/src/lib/ratelimit.ts`
- Modify: `worker/src/index.ts`
- Test: `worker/test/ratelimit.test.ts`

**Interfaces:**
- Consumes: `env.RL` (KV), `sessionId`.
- Produces: `checkLimit(env, sessionId, limit?, windowSec?): Promise<boolean>` - KV counter keyed `rl:<sessionId>` with TTL; returns `false` when over `limit` (default 20 per 3600s). `/chat` returns `429` when exceeded. CORS middleware restricts to `env.SITE_ORIGIN`.

- [ ] **Step 1: Write the failing test `worker/test/ratelimit.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { checkLimit } from "../src/lib/ratelimit";

function kv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => void store.set(k, v),
  } as unknown as KVNamespace;
}

describe("checkLimit", () => {
  it("allows up to the limit then blocks", async () => {
    const env = { RL: kv() } as any;
    let allowed = 0;
    for (let i = 0; i < 5; i++) if (await checkLimit(env, "s", 3, 3600)) allowed++;
    expect(allowed).toBe(3);
  });
  it("separate sessions have separate counters", async () => {
    const env = { RL: kv() } as any;
    expect(await checkLimit(env, "a", 1, 3600)).toBe(true);
    expect(await checkLimit(env, "b", 1, 3600)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd worker && npm test -- ratelimit`
Expected: FAIL.

- [ ] **Step 3: Create `worker/src/lib/ratelimit.ts`**

```typescript
import type { Env } from "../index";

export async function checkLimit(env: Env, sessionId: string, limit = 20, windowSec = 3600): Promise<boolean> {
  const key = `rl:${sessionId}`;
  const current = Number((await env.RL.get(key)) ?? "0");
  if (current >= limit) return false;
  await env.RL.put(key, String(current + 1), { expirationTtl: windowSec });
  return true;
}
```

- [ ] **Step 4: Add CORS + rate limit in `worker/src/index.ts`** - add CORS middleware near the top (after `const app = ...`) and the limit check inside `/chat`:

```typescript
import { cors } from "hono/cors";
import { checkLimit } from "./lib/ratelimit";

app.use("*", async (c, next) => {
  const mw = cors({ origin: c.env.SITE_ORIGIN, allowMethods: ["POST", "GET", "OPTIONS"] });
  return mw(c, next);
});
```

Inside the `/chat` handler, before calling `handleChat`:

```typescript
app.post("/chat", async (c) => {
  const body = await c.req.json<{ messages: { role: "user" | "assistant"; content: string }[]; lang: string; sessionId: string }>();
  if (!(await checkLimit(c.env, body.sessionId))) return c.json({ error: "rate_limited" }, 429);
  return handleChat(c.env, body);
});
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd worker && npm test -- ratelimit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add worker/src/lib/ratelimit.ts worker/src/index.ts worker/test/ratelimit.test.ts
git commit -m "feat(worker): per-session rate limit and CORS"
```

---

### Task 14: Deploy config, provisioning commands, and README

**Files:**
- Create: `worker/README.md`
- Modify: `worker/wrangler.toml` (fill real ids after provisioning)

**Interfaces:** none (ops task).

- [ ] **Step 1: Create the Vectorize index and KV namespace**

Run:
```bash
cd worker
npx wrangler vectorize create ptsd-chatbot --dimensions=1024 --metric=cosine
npx wrangler kv namespace create RL
```
Expected: prints the index and a KV `id`. Paste the KV id into `wrangler.toml` `[[kv_namespaces]] id`.

- [ ] **Step 2: Set the Gemini secret**

Run:
```bash
npx wrangler secret put GEMINI_API_KEY
```
Expected: prompts for the key; stored as a Worker secret (never in the repo).

- [ ] **Step 3: Set the real vars**

Edit `worker/wrangler.toml`: set `SITE_ORIGIN` to the production site origin, confirm `API_BASE`, set `GEMINI_MODEL` to the confirmed Flash id, and set `ADMIN_VERIFY_URL` to a real authenticated `/api/admin/*` endpoint (or switch `auth.ts` to local JWT verification per Task 12 note).

- [ ] **Step 4: Create `worker/README.md`**

```markdown
# PTSD.IL Chatbot Worker

Cloudflare Worker: grounded RAG chat + admin-gated reindex.

## Endpoints
- `POST /chat` (public, rate-limited) → SSE: `crisis` | `token` | `sources` | `done` | `error`
- `POST /reindex` (admin JWT) → `{ ok, upserted }`
- `GET /health` → `{ ok: true }`

## Setup
1. `npm install`
2. `wrangler vectorize create ptsd-chatbot --dimensions=1024 --metric=cosine`
3. `wrangler kv namespace create RL` → put id in wrangler.toml
4. `wrangler secret put GEMINI_API_KEY`
5. Set vars in wrangler.toml (SITE_ORIGIN, API_BASE, GEMINI_MODEL, ADMIN_VERIFY_URL)

## Test / deploy
- `npm test`
- `npm run deploy`

## First index
`curl -X POST https://<worker>/reindex -H "Authorization: Bearer <admin JWT>" -d '{"scope":"all"}'`
```

- [ ] **Step 5: Full test run + deploy**

Run:
```bash
cd worker && npm test && npm run deploy
```
Expected: all tests PASS; `wrangler` prints the deployed Worker URL.

- [ ] **Step 6: Seed the index and smoke-test**

Run:
```bash
curl -sS -X POST "$WORKER_URL/reindex" -H "Authorization: Bearer $ADMIN_JWT" -d '{"scope":"all"}'
curl -sS -N -X POST "$WORKER_URL/chat" -H "content-type: application/json" \
  -d '{"messages":[{"role":"user","content":"מהן הזכויות שלי אחרי פגיעה?"}],"lang":"he","sessionId":"smoke1"}'
```
Expected: reindex returns `{ ok:true, upserted:>0 }`; chat streams `token` frames then a `sources` frame.

- [ ] **Step 7: Commit**

```bash
git add worker/README.md worker/wrangler.toml
git commit -m "chore(worker): deploy config, provisioning, and README"
```

---

## Self-Review

**Spec coverage:**
- §3/§4 architecture, Worker, Vectorize, bge-m3, Gemini → Tasks 1,5,6,10,11.
- §5 query flow (crisis→embed→retrieve→generate→SSE) → Task 11.
- §6 reindex flow → Task 7.
- §7 content/chunking → Tasks 2,3.
- §8 retrieval/generation/citations (`[[n]]` + numbered sources + grounded refusal) → Tasks 9,11. Citation *drawer* and superscript rendering are frontend (Plan 2); the Worker's `sources` frame carries the mapping (Task 11).
- §9 languages / translate-from-Hebrew → Task 9 (system prompt), Task 11 (refusal strings).
- §10 crisis + no-medical-advice → Tasks 8,9,11.
- §11 security (reindex JWT gate, chat rate limit, CORS) → Tasks 12,13.
- §12 store nothing → honored (no persistence anywhere; error frames carry message text only, not stored).
- §14 contracts → Tasks 11,12 match the documented shapes.
- §15 ops/cost → Task 14.
- §16 testing → every task is TDD; retrieval/safety eval is exercised in Tasks 8,11 and smoke-tested in Task 14.
- §18 dependencies flagged inline (Tasks 4,5,12,14).

**Placeholder scan:** No "TBD/TODO/handle edge cases" steps; every code step contains complete, runnable code.

**Type consistency:** `Item`, `Chunk`, `ChunkMeta`, `Hit`, `Msg`, `Env` are defined once and reused with matching shapes across tasks. Function names (`extractText`, `chunk`, `fetchAllItems`, `fetchItem`, `embed`, `upsertItemChunks`, `deleteItem`, `query`, `reindexItem`, `reindexAll`, `reindexById`, `detectCrisis`, `buildContents`, `streamGemini`, `handleChat`, `verifyAdmin`, `checkLimit`) are consistent between definition and call sites.
