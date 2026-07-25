# Questionnaire DB Wiring + Admin CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the PCL-5 questionnaire from the API (public read + `/admin` full CRUD), retiring the last static content module.

**Architecture:** The backend exposes a dedicated questionnaires REST resource (`/questionnaires`, `/admin/questionnaires`) with native fields - NOT the `/articles` + `content`-JSON pattern the rest of the site uses. Public reads add a `fetchQuestionnaire` adapter + `useQuestionnaire` hook; the page renders loading/error states, DB-driven scoring/labels, and keeps the Hebrew sectioned look via a client-side presentation overlay. Admin gets dedicated `adminSource` functions and a rewritten full-CRUD panel. ar/ru/fr are seeded from the static translations, then the static arrays are deleted.

**Tech Stack:** React 18 + Vite 6 (JSX, `checkJs`), `@tanstack/react-query`, Tailwind, existing `adminApi`/`api` fetch wrappers. No test runner (`AGENTS.md`) - verification is `npm run build` + `npm run typecheck` + live-API `curl`.

## Global Constraints

- All commands run from `PTSD.IL/src/` (not repo root). Repo lives at `/workspace/TechHeal-30f64513/PTSD.IL`.
- No test runner exists. Do NOT write unit tests or claim "tests pass". Verify via `npm run build`, `npm run typecheck`, and `curl` against `https://ptsd-il-api.onrender.com/api`.
- Commit directly to `master`. Never push, never open a PR.
- Never use em-dashes or en-dashes anywhere (JSX, strings, comments, markdown). Regular hyphen only.
- Do NOT invent or alter clinical content. Question wording/scores come verbatim from the DB or the existing static file. Do NOT remove disclaimers/anonymity language.
- Questionnaires are a DEDICATED resource: no `parseContent`, no `JSON.stringify(content)`, no `writeArticle`/`reindexItem`. Native fields only.
- `totalQuestions` is server-managed: never send it on create/update; display read-only.
- Path alias `@/` -> `src/`. Use logical CSS props (`ms-*`/`me-*`), never `left`/`right`.
- Admin JWT for live seeding/smoke-test is held by the orchestrator (Opus), passed via env var at run time - it is NOT committed, NOT written to any file, NOT saved to memory.

**Live-API facts (verified 2026-07-25):** `pcl-5` seeded in `en`+`he` (flat 20 questions, 5 options each, scores 0-4, option `answer` carries the scale label). `ar`/`ru`/`fr` return `[]`. Endpoints and shapes per `docs/questionnaires-api.md`.

---

### Task 1: Public read adapter + hook

**Files:**
- Modify: `src/api/source.js` (append a new exported adapter near the other `fetch*` exports)
- Modify: `src/api/hooks.js` (add import + hook)

**Interfaces:**
- Produces: `fetchQuestionnaire({ lang, slug }) : Promise<Questionnaire>` where `Questionnaire = { id, langId, slug, name, description, totalQuestions, maxScore, cutoffScore, questions: Array<{ id, sortOrder, text, options: Array<{ answer, score, order }> }> }` (questions sorted by `sortOrder`, options sorted by `order`).
- Produces: `useQuestionnaire({ lang, slug }) : ReactQueryResult<Questionnaire>` with queryKey `['questionnaire', slug, lang]`.

- [ ] **Step 1: Add the adapter to `src/api/source.js`**

Append at the end of the file (uses the existing module-level `api()` helper; questionnaires do NOT use `parseContent`):

```js
// ─── Questionnaires ──────────────────────────────────────────────────────────
// A DEDICATED API resource (NOT the /articles+content pattern). Native fields
// only; questions/options come back structured, no JSON.parse needed. See
// docs/questionnaires-api.md and docs/superpowers/specs/2026-07-25-questionnaire-db-wiring-design.md.
export async function fetchQuestionnaire({ lang = 'he', slug = 'pcl-5' } = {}) {
  let q;
  try {
    q = await api(`/questionnaires/slug/${slug}?langId=${lang}`);
  } catch (err) {
    // 404 = no row for this (slug, lang). Fall back to Hebrew (consistent with
    // the rest of the site) so a not-yet-seeded language never hard-crashes.
    if (lang !== 'he' && /^404\b/.test(err.message)) {
      q = await api(`/questionnaires/slug/${slug}?langId=he`);
    } else {
      throw err;
    }
  }
  const questions = [...(q.questions ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(qn => ({
      ...qn,
      options: [...(qn.options ?? [])].sort((a, b) => a.order - b.order),
    }));
  return { ...q, questions };
}
```

- [ ] **Step 2: Add the hook to `src/api/hooks.js`**

Add `fetchQuestionnaire` to the existing import block from `./source`, then add the hook:

```js
export function useQuestionnaire({ lang, slug = 'pcl-5' }) {
  return useQuery({
    queryKey: ['questionnaire', slug, lang],
    queryFn: () => fetchQuestionnaire({ lang, slug }),
  });
}
```

- [ ] **Step 3: Verify typecheck + build**

Run: `cd src && npm run typecheck && npm run build`
Expected: both pass, no new errors.

- [ ] **Step 4: Verify the endpoint shape the adapter expects**

Run:
```bash
curl -s "https://ptsd-il-api.onrender.com/api/questionnaires/slug/pcl-5?langId=he" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('keys:',sorted(d)); print('nq:',len(d['questions'])); print('opt0:',d['questions'][0]['options'][0])"
```
Expected: keys include `name description maxScore cutoffScore totalQuestions questions`; `nq: 20`; `opt0` has `answer score order`.

- [ ] **Step 5: Commit**

```bash
git add src/api/source.js src/api/hooks.js
git commit -m "feat: fetchQuestionnaire adapter + useQuestionnaire hook"
```

---

### Task 2: Hebrew presentation overlay module

The DB is flat; the Hebrew page needs section headers/icons + intro. This module holds ONLY presentation metadata (no question text), copied verbatim from the current `src/data/static/questionnaire.js` `he` block so the static file can be deleted in Task 7.

**Files:**
- Create: `src/data/questionnaireSections.js`

**Interfaces:**
- Produces: `HE_SECTIONS = { intro: string, sections: Array<{ icon: string, title: string, count: number }> }`. `count` values `[5, 2, 7, 6]` sum to 20 = `totalQuestions`.

- [ ] **Step 1: Create the module**

```js
// Presentation overlay for the Hebrew questionnaire. The DB stores a FLAT
// 20-question list with no notion of sections; this supplies the section
// headers/icons + the intro line, and the counts used to slice the flat DB
// questions into sections IN ORDER. Question TEXT is NOT here - it comes from
// the API. Titles/icons/intro copied verbatim from the former
// src/data/static/questionnaire.js `he` block. Hebrew-only by design.
export const HE_SECTIONS = {
  intro: 'קח נשימה, תחשוב על החודש האחרון ועל האירוע שעברת, ותראה כמה כל דבר כאן מציק לך:',
  sections: [
    { icon: '🧠', title: 'מחשבות שלא עוזבות', count: 5 },
    { icon: '🛑', title: 'הניסיונות לברוח', count: 2 },
    { icon: '😔', title: 'מה שזה עשה למצב הרוח שלך', count: 7 },
    { icon: '⚡', title: 'הגוף שנשאר דרוך', count: 6 },
  ],
};
```

- [ ] **Step 2: Verify typecheck**

Run: `cd src && npm run typecheck`
Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add src/data/questionnaireSections.js
git commit -m "feat: Hebrew questionnaire section presentation overlay"
```

---

### Task 3: Rewrite `Questionnaire.jsx` to read from the API

**Files:**
- Modify: `src/pages/Questionnaire.jsx` (full rewrite of data sourcing + render; keep the visual design/classes)

**Interfaces:**
- Consumes: `useQuestionnaire` (Task 1), `HE_SECTIONS` (Task 2).

- [ ] **Step 1: Replace the file contents**

Full new file (preserves all existing Tailwind classes/visual design; swaps static `db` for the hook; adds loading/error; scores by `option.score`; labels from DB `options[].answer`; Hebrew sections via overlay):

```jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { IMAGES } from '@/lib/images';
import { useQuestionnaire } from '@/api/hooks';
import { HE_SECTIONS } from '@/data/questionnaireSections';

// `question` is the DB question object: { text, options: [{answer, score, order}] }.
// The selected value stored in `answers` is the option INDEX; the score comes
// from that option's `score` field.
function QuestionCard({ idx, question, answers, onAnswer }) {
  const isAnswered = answers[idx] !== undefined;
  const opts = question.options;
  return (
    <div className={`p-6 rounded-super bg-card border transition-natural shadow-card ${
      isAnswered ? 'border-primary/30' : 'border-border'
    }`}>
      <div className="flex gap-3 mb-5">
        <span className="text-2xl font-heading font-bold text-clay/40 flex-shrink-0 leading-tight mt-0.5">
          {String(idx + 1).padStart(2, '0')}
        </span>
        <p className="text-foreground leading-relaxed font-medium">{question.text}</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {opts.map((opt, oi) => (
          <button
            key={oi}
            onClick={() => onAnswer(idx, oi)}
            className={`
              flex flex-col items-center gap-1 p-2 rounded-lg border transition-natural text-center
              ${answers[idx] === oi
                ? 'bg-primary border-primary text-white'
                : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
              }
            `}
          >
            <span className="text-base font-bold">{opt.score}</span>
            <span className="text-[10px] leading-tight text-current opacity-70 hidden sm:block">
              {opt.answer}
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1 px-1">
        <span className="text-xs text-muted-foreground">{opts[0]?.answer}</span>
        <span className="text-xs text-muted-foreground">{opts[opts.length - 1]?.answer}</span>
      </div>
    </div>
  );
}

export default function Questionnaire() {
  const { lang } = useLang();
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const isHebrew = lang === 'he';

  const { data: q, isLoading, error } = useQuestionnaire({ lang });

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const questions = q?.questions ?? [];
  const TOTAL = q?.totalQuestions ?? questions.length;
  const answered = Object.keys(answers).length;
  const progress = TOTAL ? (answered / TOTAL) * 100 : 0;

  function handleAnswer(idx, optIdx) {
    setAnswers(prev => ({ ...prev, [idx]: optIdx }));
  }

  function calculate() {
    if (answered < TOTAL) return;
    const score = questions.reduce((s, qn, i) => {
      const oi = answers[i];
      return s + (oi === undefined ? 0 : (qn.options[oi]?.score ?? 0));
    }, 0);
    setResult(score);
  }

  function reset() {
    setAnswers({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const title = q?.name || t(lang, 'questionnaire_title');
  const subtitle = q?.description || t(lang, 'questionnaire_intro');
  const isHigh = result !== null && q?.cutoffScore != null && result >= q.cutoffScore;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        size="editorial"
        align="center"
        tone="dark"
        image={IMAGES.questionnaire_hero}
        imageOpacity={0.55}
        title={title}
        subtitle={subtitle}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground/70">
          {t(lang, 'questionnaire_anonymous_note')}
        </p>
      </div>

      {isLoading ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 text-center text-muted-foreground py-16">
          {t(lang, 'loading') || 'טוען...'}
        </div>
      ) : error || !q ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <div className="rounded-super p-8 text-center bg-card border border-clay/30">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-clay" />
            <p className="text-muted-foreground">{t(lang, 'error_loading') || 'שגיאה בטעינת השאלון. נסו לרענן.'}</p>
          </div>
        </div>
      ) : result === null ? (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{t(lang, 'pcl_instruction')}</span>
              <span>{answered}/{TOTAL}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {isHebrew ? (
            <HebrewSectioned questions={questions} answers={answers} onAnswer={handleAnswer} />
          ) : (
            <div className="space-y-6">
              {questions.map((qn, idx) => (
                <QuestionCard key={qn.id ?? idx} idx={idx} question={qn} answers={answers} onAnswer={handleAnswer} />
              ))}
            </div>
          )}

          {/* Calculate button */}
          <div className="mt-10 text-center">
            <button
              onClick={calculate}
              disabled={answered < TOTAL}
              className={`
                px-8 py-4 rounded-super font-bold text-lg transition-natural
                ${answered >= TOTAL
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-atmospheric-md hover:shadow-atmospheric-lg'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                }
              `}
            >
              {t(lang, 'calculate')}
            </button>
            {answered < TOTAL && (
              <p className="text-sm text-muted-foreground mt-2">
                {`${TOTAL - answered} ${t(lang, 'questions_remaining_suffix')}`}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Result */
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16">
          <div className={`rounded-super p-8 sm:p-10 text-center shadow-atmospheric-lg border ${
            isHigh ? 'bg-card border-primary/30' : 'bg-card border-teal/30'
          }`}>
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
              isHigh ? 'bg-primary/10 text-primary' : 'bg-teal/10 text-teal'
            }`}>
              {isHigh ? <AlertCircle className="w-10 h-10" /> : <CheckCircle className="w-10 h-10" />}
            </div>

            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              {t(lang, isHigh ? 'result_high_title' : 'result_low_title')}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {t(lang, isHigh ? 'result_high_text' : 'result_low_text')}
            </p>

            <div className="mb-8">
              <div className={`h-3 rounded-full overflow-hidden ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-teal via-yellow-400 to-clay`}>
                <div
                  className="h-full w-1.5 bg-foreground rounded-full transition-all duration-1000 relative"
                  style={{ marginInlineStart: `${q.maxScore ? (result / q.maxScore) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{t(lang, 'scale_mild')}</span>
                <span>{t(lang, 'scale_significant')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={isHigh ? '/self-help' : '/calming'}
                className="px-6 py-3 bg-primary text-white rounded-super font-medium hover:bg-primary/90 transition-natural shadow-atmospheric flex items-center justify-center gap-2"
              >
                {t(lang, isHigh ? 'go_to_self_help' : 'go_to_calming')}
                <ArrowIcon className="w-4 h-4" />
              </Link>
              <button
                onClick={reset}
                className="px-6 py-3 bg-muted text-foreground rounded-super font-medium hover:bg-muted/80 transition-natural flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t(lang, 'start_over')}
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              {t(lang, 'questionnaire_anonymous_note')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Hebrew sectioned render: slices the flat DB question list into the overlay's
// sections by order. Any questions beyond the overlay's summed counts render
// flat below the last section (defensive - never drop a question).
function HebrewSectioned({ questions, answers, onAnswer }) {
  let idx = 0;
  const blocks = HE_SECTIONS.sections.map((section, sIdx) => {
    const slice = questions.slice(idx, idx + section.count);
    const startIdx = idx;
    idx += section.count;
    return (
      <div key={sIdx}>
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
          <span className="text-2xl">{section.icon}</span>
          <h2 className="font-heading font-bold text-foreground text-lg">{section.title}</h2>
        </div>
        <div className="space-y-4">
          {slice.map((qn, i) => (
            <QuestionCard key={qn.id ?? startIdx + i} idx={startIdx + i} question={qn} answers={answers} onAnswer={onAnswer} />
          ))}
        </div>
      </div>
    );
  });
  const leftover = questions.slice(idx);
  return (
    <div>
      <p className="text-center text-muted-foreground italic mb-10 text-sm">{HE_SECTIONS.intro}</p>
      <div className="space-y-10">
        {blocks}
        {leftover.length > 0 && (
          <div className="space-y-4">
            {leftover.map((qn, i) => (
              <QuestionCard key={qn.id ?? idx + i} idx={idx + i} question={qn} answers={answers} onAnswer={onAnswer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck + build**

Run: `cd src && npm run typecheck && npm run build`
Expected: pass. (If `t(lang,'loading')`/`'error_loading')` keys are missing they return the key string; the `||` fallback covers it - no crash. Optionally add `loading`/`error_loading` keys to `src/lib/i18n.js` for he/en, but the fallbacks make it non-blocking.)

- [ ] **Step 3: Manual render check (dev server)**

Run: `cd src && npm run dev`, open `http://localhost:5173/questionnaire`. Confirm: Hebrew shows 4 sections with icons + intro line, 20 questions; switching to English shows a flat 20-question list; answering all 20 enables the button; result page shows the spectrum + branch. (Google login is NOT needed - this is a public page.)

- [ ] **Step 4: Commit**

```bash
git add src/pages/Questionnaire.jsx
git commit -m "feat: questionnaire page reads from API (loading/error, DB scoring, HE overlay)"
```

---

### Task 4: Admin write layer in `adminSource.js`

**Files:**
- Modify: `src/api/adminSource.js` (add a dedicated questionnaires section)

**Interfaces:**
- Consumes: existing `adminApi(method, path, body)` (already imported in this file - verify the import line exists; if not, add `import { adminApi } from './adminClient';`).
- Produces: `loadQuestionnaires()`, `loadQuestionnaireDetail(id)`, `createQuestionnaire(draft)`, `updateQuestionnaire(id, draft)`, `removeQuestionnaire(id)`, `addQuestion(questionnaireId, q)`, `updateQuestion(questionnaireId, id, q)`, `removeQuestion(questionnaireId, id)`.
  - `draft` metadata fields: `{ langId, slug, name, description, maxScore, cutoffScore, isActive, sortOrder, audienceIds? }`.
  - `q` fields: `{ sortOrder, text, options: [{ answer, score, order }] }`.

- [ ] **Step 1: Append the questionnaires section to `src/api/adminSource.js`**

```js
// ─── Questionnaires (dedicated resource; NOT /admin/articles) ─────────────────
// totalQuestions is server-managed - never sent. cutoffScore may be null.
const QUESTIONNAIRES = '/admin/questionnaires';

export function loadQuestionnaires() {
  return adminApi('GET', QUESTIONNAIRES);
}

export function loadQuestionnaireDetail(id) {
  return adminApi('GET', `${QUESTIONNAIRES}/${id}`);
}

function toNullableInt(v) {
  return v === '' || v === null || v === undefined ? null : Number(v);
}

export function createQuestionnaire(draft) {
  const body = {
    langId: draft.langId,
    slug: draft.slug,
    name: draft.name,
    description: draft.description ?? null,
    maxScore: Number(draft.maxScore),
    cutoffScore: toNullableInt(draft.cutoffScore),
    isActive: draft.isActive ?? true,
    sortOrder: Number(draft.sortOrder ?? 0),
  };
  if (Array.isArray(draft.audienceIds)) body.audienceIds = draft.audienceIds;
  return adminApi('POST', QUESTIONNAIRES, body);
}

export function updateQuestionnaire(id, draft) {
  const body = {};
  for (const k of ['langId', 'slug', 'name', 'description', 'isActive']) {
    if (k in draft) body[k] = draft[k];
  }
  if ('maxScore' in draft) body.maxScore = Number(draft.maxScore);
  if ('cutoffScore' in draft) body.cutoffScore = toNullableInt(draft.cutoffScore);
  if ('sortOrder' in draft) body.sortOrder = Number(draft.sortOrder);
  if (Array.isArray(draft.audienceIds)) body.audienceIds = draft.audienceIds;
  return adminApi('PUT', `${QUESTIONNAIRES}/${id}`, body);
}

export function removeQuestionnaire(id) {
  return adminApi('DELETE', `${QUESTIONNAIRES}/${id}`);
}

function normalizeOptions(options) {
  return (options ?? []).map((o, i) => ({
    answer: o.answer,
    score: Number(o.score),
    order: o.order === undefined || o.order === '' ? i : Number(o.order),
  }));
}

export function addQuestion(questionnaireId, q) {
  return adminApi('POST', `${QUESTIONNAIRES}/${questionnaireId}/questions`, {
    sortOrder: Number(q.sortOrder ?? 0),
    text: q.text,
    options: normalizeOptions(q.options),
  });
}

export function updateQuestion(questionnaireId, id, q) {
  const body = {};
  if ('sortOrder' in q) body.sortOrder = Number(q.sortOrder);
  if ('text' in q) body.text = q.text;
  if ('options' in q) body.options = normalizeOptions(q.options);
  return adminApi('PUT', `${QUESTIONNAIRES}/${questionnaireId}/questions/${id}`, body);
}

export function removeQuestion(questionnaireId, id) {
  return adminApi('DELETE', `${QUESTIONNAIRES}/${questionnaireId}/questions/${id}`);
}
```

- [ ] **Step 2: Verify the `adminApi` import exists**

Run: `cd src && grep -n "adminApi" api/adminSource.js | head -3`
Expected: an `import { adminApi ... } from './adminClient'` line near the top. If absent, add it.

- [ ] **Step 3: Verify typecheck + build**

Run: `cd src && npm run typecheck && npm run build`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/api/adminSource.js
git commit -m "feat: adminSource questionnaire CRUD (dedicated /admin/questionnaires)"
```

---

### Task 5: Rewrite the admin `QuestionnairePanel` to full CRUD

**Files:**
- Modify: `src/pages/Admin.jsx` (replace read-only `QuestionnairePanel` at ~lines 1498-1586; update the `adminSource` import block at lines 10-20)

**Interfaces:**
- Consumes: Task 4 exports; existing `runWrite`, `Section`, `AddNewButton`, `LoadingRow` in this file.

- [ ] **Step 1: Extend the `adminSource` import block (lines 10-20)**

Add these names to the existing `import { ... } from '@/api/adminSource';` block:

```js
  loadQuestionnaires, loadQuestionnaireDetail,
  createQuestionnaire, updateQuestionnaire, removeQuestionnaire,
  addQuestion, updateQuestion, removeQuestion,
```

- [ ] **Step 2: Replace `QuestionnairePanel` (and drop the now-unused `db` read)**

Replace the entire read-only `QuestionnairePanel` function with this full-CRUD implementation. It is self-contained (does not reuse `EditableCard`, because of nested options):

```jsx
// Full CRUD for the questionnaires resource (dedicated API, not /admin/articles).
// Lists every (slug x language) row; edit metadata; expand to edit questions +
// options; create/delete questionnaires and questions. totalQuestions is
// server-managed (read-only). Deletes are admin-only server-side - a moderator
// gets a 403 toast via runWrite.
function QuestionnairePanel() {
  const [items, setItems] = useState(null);
  const [creating, setCreating] = useState(false);

  async function reload() {
    try {
      setItems(await loadQuestionnaires());
    } catch (err) {
      toast.error(err?.message || 'שגיאה בטעינת השאלונים');
      setItems([]);
    }
  }
  useEffect(() => { reload(); }, []);

  if (items === null) return <LoadingRow />;

  return (
    <div>
      <Section title="שאלונים" count={items.length} />
      <p className="text-xs text-muted-foreground mb-4">
        שורה אחת לכל שפה. totalQuestions מנוהל בשרת ומתעדכן אוטומטית עם הוספת/מחיקת שאלות.
      </p>

      {creating && (
        <QuestionnaireMetaForm
          initial={{ langId: 'he', slug: 'pcl-5', name: '', description: '', maxScore: 80, cutoffScore: 33, isActive: true, sortOrder: 0 }}
          onCancel={() => setCreating(false)}
          onSave={async draft => {
            const ok = await runWrite(() => createQuestionnaire(draft));
            if (ok) { setCreating(false); await reload(); }
          }}
        />
      )}

      <div className="space-y-3 mt-3">
        {items.map(q => (
          <QuestionnaireRow key={q.id} q={q} onChanged={reload} />
        ))}
      </div>

      <AddNewButton label="הוספת שאלון חדש" onClick={() => setCreating(true)} />
    </div>
  );
}

// One questionnaire row: metadata view/edit + expandable questions editor.
function QuestionnaireRow({ q, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="p-4">
        {editing ? (
          <QuestionnaireMetaForm
            initial={q}
            onCancel={() => setEditing(false)}
            onSave={async draft => {
              const ok = await runWrite(() => updateQuestionnaire(q.id, draft));
              if (ok) { setEditing(false); await onChanged(); }
            }}
          />
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">{q.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {q.langId} · slug: {q.slug} · שאלות: {q.totalQuestions} · max: {q.maxScore} · סף: {q.cutoffScore ?? '-'} · {q.isActive ? 'פעיל' : 'לא פעיל'}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setEditing(true)} className="p-2 rounded-lg border border-border hover:bg-muted" title="עריכה"><Pencil className="w-4 h-4" /></button>
              <button
                onClick={async () => {
                  if (!window.confirm(`למחוק את השאלון "${q.name}" (${q.langId})? פעולה זו מוחקת גם את כל שאלותיו.`)) return;
                  const ok = await runWrite(() => removeQuestionnaire(q.id));
                  if (ok) await onChanged();
                }}
                className="p-2 rounded-lg border border-border hover:bg-muted text-clay" title="מחיקה"
              ><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border">
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full text-start px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          {expanded ? '▾' : '▸'} שאלות ({q.totalQuestions})
        </button>
        {expanded && <QuestionsEditor questionnaireId={q.id} onChanged={onChanged} />}
      </div>
    </div>
  );
}

// Metadata form for create/edit.
function QuestionnaireMetaForm({ initial, onSave, onCancel }) {
  const [draft, setDraft] = useState({
    langId: initial.langId ?? 'he',
    slug: initial.slug ?? '',
    name: initial.name ?? '',
    description: initial.description ?? '',
    maxScore: initial.maxScore ?? 0,
    cutoffScore: initial.cutoffScore ?? '',
    isActive: initial.isActive ?? true,
    sortOrder: initial.sortOrder ?? 0,
  });
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const inputCls = 'w-full px-3 py-2 rounded-lg border border-border bg-background text-sm';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">שפה (langId)</label>
          <input className={inputCls} value={draft.langId} onChange={e => set('langId', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">slug</label>
          <input className={inputCls} value={draft.slug} onChange={e => set('slug', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">ציון מקסימלי</label>
          <input type="number" className={inputCls} value={draft.maxScore} onChange={e => set('maxScore', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">סף קליני</label>
          <input type="number" className={inputCls} value={draft.cutoffScore} onChange={e => set('cutoffScore', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1">שם</label>
        <input className={inputCls} value={draft.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1">תיאור</label>
        <textarea className={inputCls} rows={2} value={draft.description ?? ''} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">סדר תצוגה</label>
          <input type="number" className={inputCls} value={draft.sortOrder} onChange={e => set('sortOrder', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!draft.isActive} onChange={e => set('isActive', e.target.checked)} />
          פעיל
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(draft)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-1"><Check className="w-4 h-4" /> שמירה</button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-border text-sm flex items-center gap-1"><X className="w-4 h-4" /> ביטול</button>
      </div>
    </div>
  );
}

// Questions editor: lazy-loads the questionnaire detail, lists questions with
// inline option editing, add/delete.
function QuestionsEditor({ questionnaireId, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [addingNew, setAddingNew] = useState(false);

  async function reload() {
    try {
      setDetail(await loadQuestionnaireDetail(questionnaireId));
    } catch (err) {
      toast.error(err?.message || 'שגיאה בטעינת השאלות');
    }
  }
  useEffect(() => { reload(); }, [questionnaireId]);

  if (detail === null) return <div className="p-4"><LoadingRow /></div>;
  const questions = [...(detail.questions ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const blankOptions = () => [0, 1, 2, 3, 4].map(n => ({ answer: '', score: n, order: n }));

  return (
    <div className="p-4 space-y-3 bg-muted/30">
      {questions.map((qn, i) => (
        <QuestionRow
          key={qn.id}
          index={i}
          question={qn}
          onSave={async draft => {
            const ok = await runWrite(() => updateQuestion(questionnaireId, qn.id, draft));
            if (ok) { await reload(); await onChanged(); }
          }}
          onDelete={async () => {
            if (!window.confirm('למחוק שאלה זו?')) return;
            const ok = await runWrite(() => removeQuestion(questionnaireId, qn.id));
            if (ok) { await reload(); await onChanged(); }
          }}
        />
      ))}

      {addingNew ? (
        <QuestionRow
          index={questions.length}
          question={{ text: '', sortOrder: questions.length, options: blankOptions() }}
          startInEdit
          onSave={async draft => {
            const ok = await runWrite(() => addQuestion(questionnaireId, draft));
            if (ok) { setAddingNew(false); await reload(); await onChanged(); }
          }}
          onDelete={() => setAddingNew(false)}
        />
      ) : (
        <AddNewButton label="הוספת שאלה" onClick={() => setAddingNew(true)} />
      )}
    </div>
  );
}

// One question: text + 5-ish options (answer/score/order), view or edit.
function QuestionRow({ index, question, onSave, onDelete, startInEdit = false }) {
  const [editing, setEditing] = useState(startInEdit);
  const [text, setText] = useState(question.text ?? '');
  const [sortOrder, setSortOrder] = useState(question.sortOrder ?? index);
  const [options, setOptions] = useState(
    (question.options ?? []).map(o => ({ answer: o.answer ?? '', score: o.score ?? 0, order: o.order ?? 0 }))
  );
  const inputCls = 'px-2 py-1.5 rounded-lg border border-border bg-background text-sm';

  const setOpt = (i, k, v) => setOptions(os => os.map((o, j) => (j === i ? { ...o, [k]: v } : o)));

  if (!editing) {
    return (
      <div className="p-3 rounded-lg border border-border bg-background flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-foreground"><span className="text-muted-foreground/60">{index + 1}. </span>{question.text}</p>
          <p className="text-xs text-muted-foreground mt-1">{(question.options ?? []).map(o => `${o.answer}=${o.score}`).join(' · ')}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setEditing(true)} className="p-2 rounded-lg border border-border hover:bg-muted"><Pencil className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-2 rounded-lg border border-border hover:bg-muted text-clay"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg border border-primary/30 bg-background space-y-2">
      <div className="flex gap-2">
        <input className={`${inputCls} w-16`} type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} title="sortOrder" />
        <input className={`${inputCls} flex-1`} value={text} onChange={e => setText(e.target.value)} placeholder="טקסט השאלה" />
      </div>
      <div className="space-y-1">
        {options.map((o, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input className={`${inputCls} flex-1`} value={o.answer} onChange={e => setOpt(i, 'answer', e.target.value)} placeholder="תשובה" />
            <input className={`${inputCls} w-16`} type="number" value={o.score} onChange={e => setOpt(i, 'score', e.target.value)} title="score" />
            <input className={`${inputCls} w-16`} type="number" value={o.order} onChange={e => setOpt(i, 'order', e.target.value)} title="order" />
            <button onClick={() => setOptions(os => os.filter((_, j) => j !== i))} className="p-1.5 rounded-lg border border-border hover:bg-muted text-clay"><X className="w-3 h-3" /></button>
          </div>
        ))}
        <button onClick={() => setOptions(os => [...os, { answer: '', score: os.length, order: os.length }])} className="text-xs text-primary flex items-center gap-1 mt-1"><Plus className="w-3 h-3" /> הוספת תשובה</button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave({ text, sortOrder, options })} className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm flex items-center gap-1"><Check className="w-4 h-4" /> שמירה</button>
        <button onClick={() => { if (startInEdit) { onDelete(); } else { setEditing(false); } }} className="px-3 py-1.5 rounded-lg border border-border text-sm flex items-center gap-1"><X className="w-4 h-4" /> ביטול</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Remove the now-dead `admin_questionnaire_readonly` reliance**

The rewritten panel no longer imports `db` for the questionnaire or uses `admin_questionnaire_readonly`. Leave the i18n key in place (harmless), but confirm `db` is still used elsewhere in `Admin.jsx` before removing its import - it is NOT removed in this task (Task 7 handles static retirement). Run: `cd src && grep -n "db\." pages/Admin.jsx` - if the only remaining use was the questionnaire panel, the import becomes unused and Task 7 removes it.

- [ ] **Step 4: Verify typecheck + build**

Run: `cd src && npm run typecheck && npm run build`
Expected: pass. Fix any unused-import lint by leaving `db` import until Task 7 (it is still referenced until then).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Admin.jsx
git commit -m "feat: full-CRUD admin questionnaire panel (metadata + questions + options)"
```

---

### Task 6: Seed ar/ru/fr + live write-path smoke test (ORCHESTRATOR-RUN)

Run by the orchestrator (Opus) directly, NOT a subagent - it uses the live admin JWT (env var `QJWT`), which must not be written to disk or committed. Uses the static `ar`/`ru`/`fr` question arrays from `src/data/static/questionnaire.js` as the source of truth.

**Files:**
- Create (temporary, gitignored/scratch): a Node script under `$CLAUDE_JOB_DIR/tmp/seed-questionnaires.mjs` - NOT committed.

- [ ] **Step 1: Write the seed script** (reads static arrays, POSTs questionnaire + questions per lang). Language metadata: `name`/`description` from `src/lib/i18n.js` (`questionnaire_title`/`questionnaire_intro`) for each lang; `maxScore: 80`, `cutoffScore: 33`, `sortOrder: 0`, `isActive: true`, `slug: 'pcl-5'`. Options per question: the language's flat scale. ar/ru/fr have no per-lang scale words in the static file (only `he`/`en` do) - use the English option answers ("Not at all" ... "Extremely") ONLY if a language scale is unavailable, OR pull localized scale labels from `src/lib/i18n.js` keys `not_at_all/a_little/moderately/quite_a_bit/extremely` if present for that lang. Verify which exist first:

Run: `cd src && node -e "import('./lib/i18n.js').then(m=>{for(const l of ['ar','ru','fr'])console.log(l, m.I18N?.[l]?.not_at_all)})" 2>/dev/null || grep -nE "not_at_all" lib/i18n.js`

Decide option labels from that output (localized if present, else English fallback - and log which was used). Do NOT fabricate translations beyond what already exists in the repo.

- [ ] **Step 2: Dry-run against ONE language (ar), then verify** via `fetchQuestionnaire`-equivalent curl:

```bash
curl -s "https://ptsd-il-api.onrender.com/api/questionnaires/slug/pcl-5?langId=ar" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['name'], len(d['questions']))"
```
Expected: the Arabic name + `20`.

- [ ] **Step 3: Seed ru + fr**, verify each returns 20 questions directly (no Hebrew fallback).

- [ ] **Step 4: Write-path smoke test** (non-destructive): pick the `he` questionnaire, `updateQuestion` its first question's text with a trailing marker, confirm via GET, then revert to the exact original text. Then `addQuestion` a throwaway question, confirm `totalQuestions` went 20 -> 21, `removeQuestion` it, confirm back to 20. Leave the live DB exactly as found.

- [ ] **Step 5:** Delete the scratch seed script. Nothing to commit (no repo files changed here). Report seeded langs + smoke-test results.

---

### Task 7: Retire the static questionnaire

**Files:**
- Modify: `src/data/static/questionnaire.js` (delete - or reduce to nothing)
- Modify: `src/data/db.js` (remove `questionnaire` export; delete file if it becomes empty)
- Modify: `src/pages/Admin.jsx` (remove now-unused `import { db } from '@/data/db'` if the questionnaire panel was its last consumer)

**Interfaces:** none produced. Only proceed once Tasks 3, 5, 6 are done and verified (nothing reads the static questionnaire anymore).

- [ ] **Step 1: Confirm no remaining readers of the static questionnaire**

Run:
```bash
cd src && grep -rn "data/static/questionnaire\|db.questionnaire\|from '@/data/db'\|from '../data/db'" pages components api lib data
```
Expected: the ONLY hits are the definitions in `data/db.js` / `data/static/questionnaire.js` themselves and (until this task) the `Admin.jsx` import. `Questionnaire.jsx` must NOT appear (Task 3 removed it).

- [ ] **Step 2: Delete the static question data**

Delete `src/data/static/questionnaire.js`. In `src/data/db.js`, remove the `questionnaire` import + export; if `db` has no other members, delete `src/data/db.js` entirely.

- [ ] **Step 3: Remove the dangling `db` import in `Admin.jsx`** if `grep -n "db\." pages/Admin.jsx` (from Task 5 Step 3) shows no remaining uses. If `db` is still used elsewhere, leave the import.

- [ ] **Step 4: Verify typecheck + build**

Run: `cd src && npm run typecheck && npm run build`
Expected: pass, no unresolved imports.

- [ ] **Step 5: Manual re-check** the public page still renders (he sectioned + en flat) with static gone: `npm run dev`, load `/questionnaire`.

- [ ] **Step 6: Update docs**

In `AGENTS.md`, update the two spots that say the questionnaire is still static / admin is read-only (the "Static layer is mostly retired" paragraph and the "Things that bite" bullet) to reflect that the questionnaire is now API-backed and editable. Keep it factual and short.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: retire static questionnaire; questionnaire is now fully API-backed"
```

---

## Self-Review

**Spec coverage:**
- Public read (dedicated endpoint, Hebrew fallback, sorted questions/options) -> Task 1. ✓
- Loading/error states, DB scoring via `option.score`, DB option labels, DB-driven header -> Task 3. ✓
- Hebrew sections via overlay -> Tasks 2 + 3 (`HebrewSectioned`). ✓
- Admin write layer (all 8 endpoints, `totalQuestions` never sent, cutoff nullable, audiences reuse) -> Task 4. ✓
- Full-CRUD panel (list/create/edit/delete questionnaire + nested questions/options) -> Task 5. ✓
- Seed ar/ru/fr + write-path smoke test (JWT-controlled) -> Task 6. ✓
- Retire static + doc update -> Task 7. ✓

**Placeholder scan:** No TBD/TODO; all steps carry real code or exact commands. Task 6 legitimately defers the option-label source to a verified `grep`/`node` check (avoids fabricating translations) rather than a placeholder.

**Type consistency:** `fetchQuestionnaire`/`useQuestionnaire` names match across Tasks 1/3. adminSource function names (`loadQuestionnaires`, `loadQuestionnaireDetail`, `createQuestionnaire`, `updateQuestionnaire`, `removeQuestionnaire`, `addQuestion`, `updateQuestion`, `removeQuestion`) match between Task 4 (definitions) and Task 5 (imports/calls). `HE_SECTIONS` shape (`intro`, `sections[].{icon,title,count}`) matches Task 2 -> Task 3. `answers[idx]` stores option INDEX consistently in Task 3 (highlight + scoring both use it).

**Note for implementers:** audiences UI is intentionally omitted from the panel form (pcl-5 has none; `audienceIds` is supported by adminSource if later needed). This is a deliberate YAGNI scope cut, not a gap.
