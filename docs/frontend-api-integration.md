# Frontend API Integration Guide

How to swap each mock / dummy request in the frontend for the real backend endpoint.

## 1. Base setup

- **Base URL**: every route is prefixed with `/api`. Example: `https://<host>/api/articles`.
- **CORS**: enabled for all origins.
- **Content type**: send `Content-Type: application/json` on every request with a body.
- **Auth**: read endpoints are public. Write endpoints (everything under `/admin`) need a JWT.
  Send it as a Bearer header:

  ```
  Authorization: Bearer <accessToken>
  ```

- **IDs**: all resource IDs are UUIDs, except **languages** whose id is a 2–5 char code (e.g. `he`, `en`, `ar`).

### Suggested client change

Replace the mock layer with one thin fetch wrapper, then point each call at the table below.

```ts
const API = import.meta.env.VITE_API_URL; // e.g. "http://localhost:3000/api"

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}
```

---

## 2. Auth — replace the fake login

| Dummy | Real |
|-------|------|
| `mockLogin()` / hard-coded token | `POST /api/auth/login` |

**Request body**
```json
{ "email": "admin@example.com", "password": "secret" }
```

**Response**
```json
{ "accessToken": "eyJhbGci..." }
```

Store `accessToken`, attach it as `Authorization: Bearer <token>` on every admin call.
Invalid credentials → `401`.

---

## 3. Public read endpoints (no auth)

These back the public-facing site. Swap each dummy fetch of static/mock data for these.

### Articles (published only)

| Dummy | Real |
|-------|------|
| `getArticles()` / `articles.json` | `GET /api/articles` |

Filter with any combination of query params (all optional):

| Param | Type | Notes |
|-------|------|-------|
| `type` | enum | `article`, `faq`, `tool`, `treatment_step`, `source`, `book`, `video`, `activity`, `download`, `story`, `app` |
| `langId` | string | language code, e.g. `he` |
| `categoryId` | uuid | |
| `categorySlug` | slug | lowercase, digits, dashes |
| `audienceId` | uuid | |
| `audienceSlug` | slug | |
| `ageGroupId` | uuid | |
| `ageGroupSlug` | slug | |
| `parentId` | uuid | child resources of a content item |

Example: `GET /api/articles?type=faq&langId=he&categorySlug=rights`

Single published article: `GET /api/articles/:id`

Returns one published article (with `categories`, `audiences`, `ageGroups`). Returns `404` if the id does not exist or the article is not published. Author info is **not** included — for that, use the admin endpoint (see §4).

Example: `GET /api/articles/3fa85f64-5717-4562-b3fc-2c963f66afa6`

### Categories

| Dummy | Real |
|-------|------|
| `getCategories()` | `GET /api/categories` (optional `?parentId=<uuid>` for children) |
| `getCategory(id)` | `GET /api/categories/:id` |

### Communities

| Dummy | Real |
|-------|------|
| `getCommunities()` | `GET /api/communities` |
| `getCommunity(id)` | `GET /api/communities/:id` |

### Age groups

| Dummy | Real |
|-------|------|
| `getAgeGroups()` | `GET /api/age-groups` |

### Audiences

| Dummy | Real |
|-------|------|
| `getAudiences()` | `GET /api/audiences` |

### Languages

| Dummy | Real |
|-------|------|
| `getLanguages()` | `GET /api/languages` |

---

## 4. Admin write endpoints (JWT required)

For the admin dashboard mocks. All require `Authorization: Bearer <token>`.
Roles: **ADMIN** or **MODERATOR** unless noted. Missing/invalid token → `401`; wrong role → `403`.

### Articles

| Dummy | Real | Role |
|-------|------|------|
| `adminListArticles()` | `GET /api/admin/articles` (same query params as public, **includes unpublished**) | ADMIN / MODERATOR |
| `adminGetArticle(id)` | `GET /api/admin/articles/:id` | ADMIN / MODERATOR |
| `createArticle(data)` | `POST /api/admin/articles` | ADMIN / MODERATOR |
| `updateArticle(id, data)` | `PATCH /api/admin/articles/:id` (partial) | ADMIN / MODERATOR |
| `deleteArticle(id)` | `DELETE /api/admin/articles/:id` | **ADMIN only** |

**Create body** (only `langId` + `title` required):
```json
{
  "type": "article",
  "langId": "he",
  "title": "My title",
  "description": null,
  "content": null,
  "url": null,
  "authors": null,
  "year": null,
  "links": [{ "label": "Source", "url": "https://..." }],
  "parentId": null,
  "authorId": "uuid",
  "categoryIds": ["uuid"],
  "audienceIds": ["uuid"],
  "ageGroupIds": ["uuid"],
  "sortOrder": 0,
  "isPublished": true
}
```
Note: `url` is **required** when `type` is `source`, `download`, or `app`.
`PATCH` accepts any subset of these fields.

### Categories

| Dummy | Real | Role |
|-------|------|------|
| `createCategory(data)` | `POST /api/admin/categories` | ADMIN / MODERATOR |
| `updateCategory(id, data)` | `PUT /api/admin/categories/:id` | ADMIN / MODERATOR |
| `deleteCategory(id)` | `DELETE /api/admin/categories/:id` | **ADMIN only** |

**Body**: `{ "slug": "rights", "name": "Rights", "parentId": null, "sortOrder": 0, "isActive": true }`
(`slug` + `name` required; `PUT` accepts partial.)

### Communities

| Dummy | Real | Role |
|-------|------|------|
| `createCommunity(data)` | `POST /api/admin/communities` | ADMIN / MODERATOR |
| `updateCommunity(id, data)` | `PUT /api/admin/communities/:id` | ADMIN / MODERATOR |
| `deleteCommunity(id)` | `DELETE /api/admin/communities/:id` | **ADMIN only** |

**Body**: `{ "name": "...", "description": null, "location": null, "meetingType": null, "organization": null, "contactUrl": null, "isActive": true }`
(`name` required.)

### Age groups

| Dummy | Real | Role |
|-------|------|------|
| `createAgeGroup(data)` | `POST /api/admin/age-groups` | ADMIN / MODERATOR |
| `updateAgeGroup(id, data)` | `PUT /api/admin/age-groups/:id` | ADMIN / MODERATOR |
| `deleteAgeGroup(id)` | `DELETE /api/admin/age-groups/:id` | **ADMIN only** |

**Body**: `{ "slug": "teens", "name": "Teens", "description": null, "min": 13, "max": 17 }`
(`slug`, `name`, `min`, `max` required.)

### Audiences

| Dummy | Real | Role |
|-------|------|------|
| `createAudience(data)` | `POST /api/admin/audiences` | ADMIN / MODERATOR |
| `updateAudience(id, data)` | `PUT /api/admin/audiences/:id` | ADMIN / MODERATOR |
| `deleteAudience(id)` | `DELETE /api/admin/audiences/:id` | **ADMIN only** |

**Body**: `{ "slug": "parents", "name": "Parents", "description": null }`
(`slug` + `name` required.)

### Languages

| Dummy | Real | Role |
|-------|------|------|
| `createLanguage(data)` | `POST /api/admin/languages` | **ADMIN only** |
| `updateLanguage(id, data)` | `PUT /api/admin/languages/:id` | **ADMIN only** |
| `deleteLanguage(id)` | `DELETE /api/admin/languages/:id` | **ADMIN only** |

**Body**: `{ "id": "he", "name": "Hebrew", "direction": "rtl", "isActive": true }`
(`id` = 2–5 char code + `name` required. `PUT` cannot change `id`.)

---

## 5. Error handling

| Status | Meaning | Frontend action |
|--------|---------|-----------------|
| `400` | Validation failed (body/query) | Show field errors; check body against shapes above |
| `401` | Missing/invalid/expired token | Redirect to login, clear stored token |
| `403` | Authenticated but wrong role | Hide/disable the action for this user |
| `404` | Resource not found | Show not-found state |

Validation errors come from Zod — the `400` body lists which fields failed, so surface it during dev.

---

## 6. Migration checklist

- [ ] Add `VITE_API_URL` (or equivalent) pointing at `<host>/api`.
- [ ] Replace mock module with the fetch wrapper from §1.
- [ ] Wire `POST /api/auth/login`, persist `accessToken`.
- [ ] Swap each public `get*` mock for its §3 endpoint.
- [ ] Swap each admin `create/update/delete` mock for its §4 endpoint + Bearer header.
- [ ] Map error states per §5.
- [ ] Delete dummy JSON/fixtures once each screen is on live data.
