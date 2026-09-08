# Questionnaires API

All paths are relative to `/api` (global prefix). Auth: `Authorization: Bearer <jwt>`. Roles: `admin`, `moderator`, `masteradmin`.

## Public

### `GET /questionnaires`

List active questionnaires.

**Query params** (all optional):

| param | type | notes |
|---|---|---|
| `langId` | string (2-5 chars) | filter by language |
| `audienceId` | uuid | filter by linked audience |
| `audienceSlug` | string, `^[a-z0-9-]+$` | filter by linked audience's slug |

**Response** `200`: `Questionnaire[]`, each with `targetAudiences` populated. Ordered by `sortOrder` ASC. Only `isActive: true` rows.

### `GET /questionnaires/slug/:slug`

Get a single questionnaire by `slug` in one specific language — for a frontend that knows the slug and the current UI language and wants just that translation (as opposed to the admin-only route below, which returns every translation, unfiltered by `isActive`).

**Query params:**

| param | type | required | notes |
|---|---|---|---|
| `langId` | string (2-5 chars) | yes | |

**Response** `200`: `Questionnaire` with `targetAudiences` and `questions` populated. Only `isActive: true` rows match.
**Response** `404`: no row matches `(slug, langId, isActive=true)`.
**Response** `422`: missing/invalid `langId`.

### `GET /questionnaires/:id`

Detail by id. Only `isActive: true` rows are visible here — an inactive/draft questionnaire 404s on this route (use the admin `GET /admin/questionnaires/:id` below to fetch it regardless of `isActive`).

**Response** `200`: `Questionnaire` with `targetAudiences` and `questions` (ordered by `sortOrder` ASC) populated.
**Response** `404`: unknown id, or the row exists but `isActive: false`.

---

## Admin (`admin` or `moderator` role, except deletes below)

### `GET /admin/questionnaires`

List all questionnaires (active and inactive), ordered by `sortOrder` ASC. No query params. Roles: `admin`, `moderator`.

**Response** `200`: `Questionnaire[]` with `targetAudiences` populated.

### `GET /admin/questionnaires/:id`

Detail by id, regardless of `isActive` (the admin counterpart to the public `GET /questionnaires/:id`, which hides inactive rows). Roles: `admin`, `moderator`.

**Response** `200`: `Questionnaire` with `targetAudiences` and `questions` populated.
**Response** `404`: unknown id.

### `GET /admin/questionnaires/slug/:slug`

Return every language translation sharing this `slug` (the multi-language grouping key), ordered by `langId` ASC. Roles: `admin`, `moderator`.

**Response** `200`: `Questionnaire[]` with `targetAudiences` populated.

### `POST /admin/questionnaires`

Create a questionnaire. Roles: `admin`, `moderator`.

**Body:**

| field | type | required | notes |
|---|---|---|---|
| `langId` | string (2-5 chars) | yes | |
| `slug` | string, `^[a-z0-9-]+$`, min 1 | yes | groups translations together; unique per `langId` |
| `name` | string, min 1 | yes | |
| `description` | string \| null | no | |
| `maxScore` | int, positive | yes | |
| `cutoffScore` | int \| null | no | |
| `isActive` | boolean | no | default `true` |
| `sortOrder` | int, ≥ 0 | no | default `0` |
| `audienceIds` | uuid[] | no | resolved into `targetAudiences`; pass `[]` explicitly to clear all audiences |

`totalQuestions` is never accepted here — it's server-managed (starts at `0`, recomputed automatically as questions are added/removed).

**Response** `201`: created `Questionnaire`.
**Response** `422`: validation failure.
**Response** `409`: duplicate `(slug, langId)`.

### `PUT /admin/questionnaires/:id`

Update a questionnaire. Same body as create, all fields optional (partial update). Roles: `admin`, `moderator`.

**Response** `200`: updated `Questionnaire`.
**Response** `404`: unknown id.
**Response** `409`: update would collide with an existing `(slug, langId)`.

### `DELETE /admin/questionnaires/:id`

Delete a questionnaire (cascades to its questions). **Role: `admin` only.**

**Response** `200`.

### `POST /admin/questionnaires/:questionnaireId/questions`

Add a question to a questionnaire. Roles: `admin`, `moderator`.

**Body:**

| field | type | required | notes |
|---|---|---|---|
| `sortOrder` | int, ≥ 0 | no | default `0` |
| `text` | string, min 1 | yes | |
| `options` | array, min 1 item | yes | see below |

Each `options[]` item:

| field | type | notes |
|---|---|---|
| `answer` | string, min 1 | |
| `score` | int | |
| `order` | int | display order within the options list |

**Response** `201`: created question. Parent's `totalQuestions` is recomputed (COUNT of questions) after this call.
**Response** `404`: unknown `questionnaireId`.
**Response** `422`: validation failure (e.g. empty `options`).

### `PUT /admin/questionnaires/:questionnaireId/questions/:id`

Update a question. Same body as create, all fields optional. The question must belong to `questionnaireId` (a question id from another questionnaire 404s). Roles: `admin`, `moderator`.

**Response** `200`: updated question.
**Response** `404`: unknown `questionnaireId`/`id` combination.

### `DELETE /admin/questionnaires/:questionnaireId/questions/:id`

Delete a question. Parent's `totalQuestions` is recomputed after. **Role: `admin` only.**

**Response** `200`.
**Response** `404`: unknown `questionnaireId`/`id` combination.

---

## `Questionnaire` shape

```ts
{
  id: string;              // uuid
  langId: string;
  slug: string;
  name: string;
  description: string | null;
  totalQuestions: number;  // server-managed
  maxScore: number;
  cutoffScore: number | null;
  isActive: boolean;
  sortOrder: number;
  targetAudiences: Audience[];
  questions?: QuestionnaireQuestion[]; // present on GET :id (public and admin-by-slug)
  createdAt: string;
  updatedAt: string;
}
```

## `QuestionnaireQuestion` shape

```ts
{
  id: string;               // uuid
  questionnaireId: string;
  sortOrder: number;
  text: string;
  options: { answer: string; score: number; order: number }[];
  createdAt: string;
  updatedAt: string;
}
```
