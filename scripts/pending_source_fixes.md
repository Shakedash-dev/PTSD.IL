# Pending source-content fixes (apply in Phase 2, needs admin token)

These are corrections to EXISTING Hebrew rows in the live DB (not new translation
rows). They require an admin token, so they are queued alongside the Phase 2
translation POST. Apply via `PATCH /api/admin/articles/:id`.

## 1. "פינת השקט" activity - "too calm" typo

- Article id: `c2712642-677c-4648-ae3f-fd8ee5f650e3`
- groupId: `3b143ea9-e787-4274-a9fc-8d3a6974f01d`  |  langId: `he`  |  type: `activity`
- Fix in `content.body`: change `כשרגוע מדי` to `כשלחוץ מדי`
  (i.e. "when too calm" -> "when too stressed"; the corner is for dysregulation,
  so "calm" was wrong. Confirmed a typo by the repo owner.)
- The ar/ru/en/fr renderings of this line were ALREADY corrected in
  `translation_backfill.json` ("too stressed" / "trop stressés" /
  "слишком напряжённо" / "متوترَين أكثر من اللازم"), so once the Hebrew is
  patched and the translations are POSTed, all 5 languages are consistent.
