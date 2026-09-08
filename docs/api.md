# API Endpoints

Base prefix: `/api` (set via `setGlobalPrefix('api')`). CORS enabled. Port `PORT` env, default `3000`.

## Auth model

- **Public** endpoints: no token.
- **Protected** endpoints: `Authorization: Bearer <accessToken>` header. Token from `POST /api/auth/login`.
- Role check is **exact match** — the caller's roles must intersect the endpoint's `AllowedRoles`. `masteradmin` is NOT implicitly granted admin CRUD; roles are checked literally as listed.
- Roles: `masteradmin`, `admin`, `moderator`, `viewer`.

Failure responses (Nest defaults): `401 Unauthorized` (missing/bad token), `403 Forbidden` (role mismatch), `400 Bad Request` (Zod validation), `404 Not Found`, `409 Conflict`.

Validation: Zod schemas. Fields marked `optional` may be omitted. `nullable` accepts `null`. Defaults noted per field.

---

## Auth — `/api/auth`

### POST `/api/auth/login` — Public
Body:
| field | type | required | default |
|-------|------|----------|---------|
| email | string (email) | yes | — |
| password | string (min 1) | yes | — |

Response `200`: `{ "accessToken": string }`

### POST `/api/auth/change-password` — Roles: masteradmin, admin, moderator, viewer
Changes password of the authenticated user (id from token).
Body:
| field | type | required | default |
|-------|------|----------|---------|
| currentPassword | string (min 1) | yes | — |
| newPassword | string (min 8) | yes | — |

Response `200`: `{ "message": "Password changed" }`

---

## Health — Public

| method | path | response |
|--------|------|----------|
| GET | `/api/alive` | `{ "status": "ok" }` |
| GET | `/api/ready` | `{ "status": "ok" }` |

---

## Articles (public read) — `/api/articles`

### GET `/api/articles` — Public
Returns published articles only. Query params (all optional):
| param | type |
|-------|------|
| type | enum ArticleType |
| langId | string (2–5 chars) |
| categoryId | uuid |
| categorySlug | slug `^[a-z0-9-]+$` |
| audienceId | uuid |
| audienceSlug | slug |
| ageGroupId | uuid |
| ageGroupSlug | slug |
| parentId | uuid |

Response `200`: `Article[]` with relations `categories`, `audiences`, `ageGroups`. Ordered by `sortOrder ASC`, then `createdAt DESC`.

### GET `/api/articles/:id` — Public
Param: `id` (path). Response `200`: single published `Article` (+ relations). `404` if not found/unpublished.

**ArticleType enum:** `article`, `faq`, `tool`, `treatment_step`, `source`, `book`, `video`, `activity`, `download`, `story`, `app`.

**Article shape (response):**
```
id: uuid
type: string (default "article")
groupId: uuid | null
langId: string
title: string
description: string | null
content: string | null
url: string | null
authors: string | null
year: string | null
links: [{ label, url }] | null
parentId: uuid | null
authorId: uuid | null
sortOrder: number (default 0)
isPublished: boolean (default true)
createdAt, updatedAt: timestamps
categories, audiences, ageGroups: [] (relations)
```

---

## Admin Articles — `/api/admin/articles`

### GET `/api/admin/articles` — Roles: admin, moderator
Same query params as public `GET /articles`, but returns ALL articles (published + unpublished). Note: admin `findAll` only filters by `type`, `langId`, `parentId`, `categoryId` (slug/audience/ageGroup params accepted by schema but ignored here).
Response `200`: `Article[]`.

### GET `/api/admin/articles/:id` — Roles: admin, moderator
Param `id`. Response `200`: `Article` (+ relations incl. `author`).

### POST `/api/admin/articles` — Roles: admin, moderator
Body:
| field | type | required | default |
|-------|------|----------|---------|
| type | enum ArticleType | no | `"article"` |
| groupId | uuid | no | auto-generated UUID if omitted |
| langId | string (2–5) | yes | — |
| title | string (min 1) | yes | — |
| description | string \| null | no | — |
| content | string \| null | no | — |
| url | string (url) \| null | no | — (required when type is `source`, `download`, or `app`) |
| authors | string \| null | no | — |
| year | string \| null | no | — |
| links | `[{ label:string, url:string }]` \| null | no | — |
| parentId | uuid \| null | no | — |
| authorId | uuid | no | — |
| categoryIds | uuid[] | no | — |
| audienceIds | uuid[] | no | — |
| ageGroupIds | uuid[] | no | — |
| sortOrder | int ≥ 0 | no | DB default `0` |
| isPublished | boolean | no | DB default `true` |

Response `201`: created `Article`.

### PATCH `/api/admin/articles/:id` — Roles: admin, moderator
Param `id`. Body: same fields as POST, all optional (no `type` default applied). Response `200`: updated `Article`.

### DELETE `/api/admin/articles/:id` — Roles: admin
Param `id`. Response `200`: empty.

---

## Age Groups — `/api/age-groups` (public) + `/api/admin/age-groups`

### GET `/api/age-groups` — Public
Response `200`: `AgeGroup[]`.

**AgeGroup shape:** `{ id: uuid, slug, name, description: string|null, min: int, max: int }`

### POST `/api/admin/age-groups` — Roles: admin, moderator
Body:
| field | type | required | default |
|-------|------|----------|---------|
| slug | slug `^[a-z0-9-]+$` | yes | — |
| name | string (min 1) | yes | — |
| description | string \| null | no | — |
| min | int ≥ 0 | yes | — |
| max | int ≥ 0 | yes | — |

Response `201`: `AgeGroup`.

### PUT `/api/admin/age-groups/:id` — Roles: admin, moderator
Param `id`. Body: all fields optional (partial). Response `200`: `AgeGroup`.

### DELETE `/api/admin/age-groups/:id` — Roles: admin
Param `id`. Response `200`.

---

## Audiences — `/api/audiences` (public) + `/api/admin/audiences`

### GET `/api/audiences` — Public
Response `200`: `Audience[]`.

**Audience shape:** `{ id: uuid, slug, name, description: string|null }`

### POST `/api/admin/audiences` — Roles: admin, moderator
Body:
| field | type | required | default |
|-------|------|----------|---------|
| slug | slug `^[a-z0-9-]+$` | yes | — |
| name | string (min 1) | yes | — |
| description | string \| null | no | — |

Response `201`: `Audience`.

### PUT `/api/admin/audiences/:id` — Roles: admin, moderator
Param `id`. Body: all fields optional (partial). Response `200`.

### DELETE `/api/admin/audiences/:id` — Roles: admin
Param `id`. Response `200`.

---

## Categories — `/api/categories` (public) + `/api/admin/categories`

### GET `/api/categories` — Public
Query: `parentId` (optional, string). Response `200`: `Category[]`.

### GET `/api/categories/:id` — Public
Param `id`. Response `200`: `Category`.

**Category shape:** `{ id: uuid, slug, parentId: uuid|null, name, sortOrder: number (default 0), isActive: boolean (default true) }`

### POST `/api/admin/categories` — Roles: admin, moderator
Body:
| field | type | required | default |
|-------|------|----------|---------|
| slug | slug `^[a-z0-9-]+$` | yes | — |
| name | string (min 1) | yes | — |
| parentId | uuid \| null | no | — |
| sortOrder | int ≥ 0 | no | DB default `0` |
| isActive | boolean | no | DB default `true` |

Response `201`: `Category`.

### PUT `/api/admin/categories/:id` — Roles: admin, moderator
Param `id`. Body: all fields optional (partial). Response `200`.

### DELETE `/api/admin/categories/:id` — Roles: admin
Param `id`. Response `200`.

---

## Communities — `/api/communities` (public) + `/api/admin/communities`

### GET `/api/communities` — Public
Response `200`: `Community[]`.

### GET `/api/communities/:id` — Public
Param `id`. Response `200`: `Community`.

**Community shape:**
```
id: uuid
name: string
description: string | null
location: string | null
meetingType: string | null
organization: string | null
contactUrl: string | null
isActive: boolean (default true)
targetAudiences: Audience[] (relation)
createdAt, updatedAt
```

### POST `/api/admin/communities` — Roles: admin, moderator
Body:
| field | type | required | default |
|-------|------|----------|---------|
| name | string (min 1) | yes | — |
| description | string \| null | no | — |
| location | string \| null | no | — |
| meetingType | string \| null | no | — |
| organization | string \| null | no | — |
| contactUrl | string (url) \| null | no | — |
| isActive | boolean | no | DB default `true` |

Response `201`: `Community`.

### PUT `/api/admin/communities/:id` — Roles: admin, moderator
Param `id`. Body: all fields optional (partial). Response `200`.

### DELETE `/api/admin/communities/:id` — Roles: admin
Param `id`. Response `200`.

---

## Languages — `/api/languages` (public) + `/api/admin/languages`

### GET `/api/languages` — Public
Response `200`: `Language[]`.

**Language shape:** `{ id: string (ISO code, e.g. he/ar/ru/en/fr), name, direction: "ltr"|"rtl" (default "ltr"), isActive: boolean (default true) }`

### POST `/api/admin/languages` — Roles: admin
Body:
| field | type | required | default |
|-------|------|----------|---------|
| id | string (2–5, ISO code) | yes | — |
| name | string (min 1) | yes | — |
| direction | `"ltr"` \| `"rtl"` | no | DB default `"ltr"` |
| isActive | boolean | no | DB default `true` |

Response `201`: `Language`.

### PUT `/api/admin/languages/:id` — Roles: admin
Param `id`. Body (partial, `id` omitted): `name`, `direction`, `isActive` — all optional. Response `200`.

### DELETE `/api/admin/languages/:id` — Roles: admin
Param `id`. Response `200`.

---

## Users (admin only) — `/api/admin/users`

All endpoints: **Roles: masteradmin**.

### GET `/api/admin/users`
Response `200`: `SafeUser[]` (no `password`).

**SafeUser shape:** `{ id: uuid, firstName, lastName, email: string|null, phone: string|null, roles: UserRoles[], createdAt, updatedAt }`

### POST `/api/admin/users`
Body:
| field | type | required | default |
|-------|------|----------|---------|
| firstName | string (min 1) | yes | — |
| lastName | string (min 1) | yes | — |
| email | string (email) | yes | — |
| password | string (min 8) | yes | — |
| phone | string (min 1) | no | `null` |
| roles | UserRoles[] (min 1) | no | `["viewer"]` |

Response `201`: `SafeUser`. `409` if email already in use.

### PUT `/api/admin/users/:id/roles`
Param `id`. Body:
| field | type | required | default |
|-------|------|----------|---------|
| roles | UserRoles[] (min 1) | yes | — |

Response `200`: `SafeUser`. `404` if user not found.

### PUT `/api/admin/users/:id/password`
Param `id`. Body:
| field | type | required | default |
|-------|------|----------|---------|
| newPassword | string (min 8) | yes | — |

Response `200`: `{ "message": "Password updated" }`. `404` if user not found.

### DELETE `/api/admin/users/:id`
Param `id`. Response `200`: empty. `403` if `id` equals the caller's own id ("You cannot delete your own account"). `404` if not found.
