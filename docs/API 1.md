# API Reference

Base URL: your server origin (e.g. `http://localhost:3000`).

Auth: admin routes require a Bearer token (`Authorization: Bearer <jwt>`) whose
user holds the required role. Public routes need no token.

Status codes: validation failure → `422`; missing/invalid token → `401`;
authenticated but wrong role → `403`; unknown id → `404`.

---

## Communities

A community is language-scoped: each row belongs to one language (`langId`).
Rows that are translations of the same community share a `groupId`.

### Entity shape (response)

```jsonc
{
  "id": "uuid",
  "groupId": "uuid | null",        // translations of one community share this
  "langId": "string",              // ISO code, e.g. "he", "ar", "en"
  "name": "string",
  "description": "string | null",
  "location": "string | null",
  "meetingType": "string | null",
  "organization": "string | null",
  "contactUrl": "string | null",
  "targetAudiences": [             // Audience[]
    { "id": "uuid", "slug": "string", "name": "string", "description": "string | null" }
  ],
  "isActive": true,
  "createdAt": "2026-07-24T00:00:00.000Z",
  "updatedAt": "2026-07-24T00:00:00.000Z"
}
```

> The `lang` relation is lazy (not eager) and is not included in payloads.

### Public routes

#### `GET /communities`

List active communities. All query params optional:

| param          | type              | notes                              |
|----------------|-------------------|------------------------------------|
| `langId`       | string (2–5)      | filter to one language             |
| `audienceId`   | uuid              | filter by target audience          |
| `audienceSlug` | `^[a-z0-9-]+$`    | filter by target audience          |

Returns `Community[]` (active only, ordered by `name` ASC).

> Caveat: when filtering by audience, each returned community loads **only the
> matching audience** in `targetAudiences` (single-join behavior, same as
> articles). Without an audience filter, all audiences load.

```bash
# all active communities
curl "$BASE/communities"

# Hebrew communities
curl "$BASE/communities?langId=he"

# Hebrew communities for a given audience (by slug)
curl "$BASE/communities?langId=he&audienceSlug=hostilities"

# by audience id
curl "$BASE/communities?audienceId=1c9d0b6e-0000-0000-0000-000000000000"
```

#### `GET /communities/:id`

Single community by id. `404` if not found.

```bash
curl "$BASE/communities/<uuid>"
```

### Admin routes

Require `Authorization: Bearer <token>`.

| Route                                   | Method | Roles              |
|-----------------------------------------|--------|--------------------|
| `/admin/communities`                    | POST   | ADMIN, MODERATOR   |
| `/admin/communities/:id`                | PUT    | ADMIN, MODERATOR   |
| `/admin/communities/:id`                | DELETE | ADMIN              |
| `/admin/communities/group/:groupId`     | GET    | ADMIN, MODERATOR   |

#### Request body (POST create / PUT update)

```jsonc
{
  "name":         "string (required, min 1)",
  "langId":       "string (required, 2-5)",   // e.g. "he"
  "description":  "string | null (optional)",
  "location":     "string | null (optional)",
  "meetingType":  "string | null (optional)",
  "organization": "string | null (optional)",
  "contactUrl":   "url | null (optional)",     // must be a valid URL
  "isActive":     "boolean (optional)",
  "groupId":      "uuid (optional)",           // omit on create -> auto-generated
  "audienceIds":  "uuid[] (optional)"          // attach target audiences
}
```

On **PUT**, every field is optional (partial update). Invalid body → `422`.

#### `POST /admin/communities` — create

```bash
curl -X POST "$BASE/admin/communities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "name": "נט\"ל - קבוצות תמיכה",
    "langId": "he",
    "description": "קבוצות תמיכה לנפגעי טראומה.",
    "location": "center",
    "meetingType": "frontal",
    "organization": "עמותת נט\"ל",
    "contactUrl": "https://www.natal.org.il/",
    "audienceIds": ["<audience-uuid>"]
  }'
```

Response `201` with the created entity (its `groupId` is auto-generated).

#### Adding a translation

Create a sibling row in another language sharing the first row's `groupId`:

```bash
curl -X POST "$BASE/admin/communities" \
  -H "Authorization: Bearer $TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "name": "NATAL - Support Groups",
    "langId": "en",
    "groupId": "<groupId-from-the-he-row>"
  }'
```

#### `PUT /admin/communities/:id` — update

```bash
curl -X PUT "$BASE/admin/communities/<uuid>" \
  -H "Authorization: Bearer $TOKEN" \
  -H "content-type: application/json" \
  -d '{ "isActive": false }'
```

#### `DELETE /admin/communities/:id` — delete (ADMIN only)

```bash
curl -X DELETE "$BASE/admin/communities/<uuid>" \
  -H "Authorization: Bearer $TOKEN"
```

Moderator token → `403`.

#### `GET /admin/communities/group/:groupId` — all translations

Returns every language version sharing the `groupId` (ordered by `langId`).

```bash
curl "$BASE/admin/communities/group/<groupId>" \
  -H "Authorization: Bearer $TOKEN"
```
