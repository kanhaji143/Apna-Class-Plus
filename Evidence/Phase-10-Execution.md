# Phase 10 — Test Portal + Free Material (Execution Evidence)

**Date:** 2026-11-12
**Status:** ✅ COMPLETE

## Scope (user request: cms.classplusapp.com Content ke "Test Portal" + "Free Material" clone)

### A. Test Portal
- **DB:** `tests`, `test_questions`, `test_attempts` (3 naye tables)
- **Server (`server/routes/tests.js`):**
  - `POST /v3/tests` — create (title, courseId, description, durationMin)
  - `GET /v3/tests` — owner list (question_count, attempt_count included)
  - `GET/PUT/DELETE /v3/tests/:id` — CRUD (delete cascades questions + attempts)
  - `POST /v3/tests/:id/questions` — MCQ add (4 options + correct a|b|c|d + marks)
  - `DELETE /v3/tests/:id/questions/:qid`
  - `GET /v3/tests/:id/full` — editor detail (test + questions + attempts)
  - `POST /v3/tests/:id/publish` — publish guard: kam se kam 1 question zaroori
  - `GET /public/test/:id` — public fetch, **`correct` field hidden** (security)
  - `POST /public/test/:id/submit` — auto-score + attempt save + per-question review
  - `GET /v3/tests/:id/attempts` — teacher results
- **Client:** `TestPortalPage` (list + create + publish chip + public link copy), `TestEditorPage` (details save + questions CRUD + results), `TestTakePage` (public `/test/:id` — start screen, countdown timer, radio answers, auto-submit on timeout, result + review)

### B. Free Material
- **DB:** `free_materials` table
- **Server (`server/routes/freeMaterial.js`):**
  - CRUD `/v3/free-materials` (type: pdf|video|youtube, status: published|draft, reorder)
  - `GET /lp/api/free-materials?teacher=|slug=` — **public** (slug → page → owner resolve)
- **Client:** `FreeMaterialPage` (CRUD + draft toggle + public link copy/open), `PublicFreeMaterialsPage` (`/free/:teacherId`, no login)
- **Landing Page Builder:** naya `FREE_MATERIAL` section type (library + props + renderPageHTML) — public render pe **live fetch** hota hai `/lp/api/free-materials?slug=` se (static fallback items ke saath)

## API Verification (PowerShell — sab PASS)
```
Test Portal:
1. Test created: id=1 ✅
2. Questions added: q1=1, q2=2 ✅
3. Publish guard: "Publish se pehle kam se kam 1 question add karo" ✅
4. Publish: published ✅
5. Public fetch: questions=2, correct hidden=True ✅
6. Submit: score=1/3 (auto-scoring sahi) ✅
7. Attempts saved (name=Ravi) ✅
8. Full editor fetch: questions=2, attempts=1 ✅

Free Material:
1. Public(teacher=1): teacher=Demo Teacher, items=2 ✅
2. Public(slug=my-coaching-page): items=2 ✅
3. Draft hidden: items=1 (expect 1) ✅
4. Landing page API unaffected: title=My Coaching Page ✅
```

## Browser E2E Verification (Playwright-style browser)
| Flow | Result |
|------|--------|
| Public `/test/1` start screen (no login) | ✅ title + duration + naam/phone fields |
| Start → 2 MCQs answered (1 sahi 1 galat) → Submit | ✅ Score **1/3 (33%)** + answer review (✅/❌) |
| Public `/free/1` | ✅ Demo Teacher ke 2 published materials + Get links |
| Landing `/lp-preview/my-coaching-page` FREE_MATERIAL section | ✅ **live fetch** se items render hue |
| Sidebar Content subMenu chips | ✅ Test Portal / Free Material clickable |
| `/content/test-portal` (protected) | ✅ test list (Draft/Published chips, attempts count) |
| `/content/test-portal/1` editor | ✅ details + questions (✓ A · 1m) + results |
| `/content/free-material` (protected) | ✅ materials list + Add Material |

## Bugs Found & Fixed (is phase mein)
1. **`courses` CREATE TABLE missing tha** init.js se (purane edit-tool clobber ka bacha hua bug) — fresh clone pe crash hota. Fixed + verified (`Select-String "CREATE TABLE"` = 19 tables).
2. **`/lp/api/free-materials` swallow ho raha tha** — landingPages ka `/lp/api/:slug` wildcard pehle match karta tha. Fix: freeMaterialRouter ko landingPages se *pehle* mount.
3. **`/lp-preview` regression** — Vite proxy `'/lp'` prefix `/lp-preview` ko bhi server pe bhej raha tha (raw JSON dikhta). Fix: proxy `'/lp/api'` precise kiya.
4. **`/public/test` proxy missing tha** — vite.config.ts mein add kiya.
5. **Auth bootstrap race (major UX bug)** — direct protected URL load pe pehla render user=null dekh ke `/login` pe redirect ho jata tha, phir auth restore hone ke baad bhi `/login` pe atka rehta tha. Fix: `booted` flag in auth state + Protected gate (`!user && !booted` → loader). Ab direct URL load pe dashboard khulta hai.

## Build
- `tsc -b` → 0 errors ✅
- `vite build` → "✓ built in 19.02s" ✅

## Test Cases (TestCases.md mein add kiye)
| TC | Result |
|----|--------|
| TC-11.1 Test create + questions | ✅ PASS (API + browser) |
| TC-11.2 Publish guard | ✅ PASS |
| TC-11.3 Public test answers hidden | ✅ PASS |
| TC-11.4 Submit + auto-score | ✅ PASS (1/3 exact) |
| TC-12.1 Free material CRUD | ✅ PASS |
| TC-12.2 Public free page + draft hidden | ✅ PASS |
| TC-12.3 Landing section live fetch | ✅ PASS |

## Screenshots
- `Evidence/phase10-test-portal.png` — Test Portal list (Draft/Published chips)
- `Evidence/phase10-test-editor.png` — Test Editor (questions + publish state)
- `Evidence/phase10-free-material.png` — Free Material manager

## Files Added/Modified
- `server/db/init.js` — tests, test_questions, test_attempts, free_materials + missing courses table fix
- `server/routes/tests.js`, `server/routes/freeMaterial.js` — new
- `server/index.js` — routers mounted (route-order fix comment ke saath)
- `client/src/features/tests/*` — TestPortalPage, TestEditorPage, TestTakePage (new)
- `client/src/features/freeMaterial/*` — FreeMaterialPage, PublicFreeMaterialsPage (new)
- `client/src/features/builder/types.ts`, `renderPageHTML.ts` — FREE_MATERIAL section
- `client/src/App.tsx` — 5 naye routes + Protected race fix
- `client/src/features/auth/authSlice.ts` — booted flag
- `client/src/components/layout/ProtectedLayout.tsx` — subMenu clickable chips
- `client/vite.config.ts` — proxy fixes
- `TestCases.md` — Module 11 + 12 added
