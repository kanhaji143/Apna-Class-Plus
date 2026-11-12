# Phase 6 — Batches & People (Execution Evidence)

**Date:** 2026-11-11
**Status:** ✅ COMPLETE (server APIs verified; client code TypeScript-clean + Vite build pass)

## Scope
- Server: Batch CRUD (POST/GET/PUT/DELETE /v2/batches), student management (/v2/batch/students/add, remove), people list (/v2/people — leads + students)
- Client: BatchesListPage (list + create dialog), BatchStudentsPage (add/remove students), PeopleListPage (leads + students with search)

## Server API Verification (PowerShell)
```
Create batch: success id=1
Add student: success sid=3
Get batch: success students=1
People: success leads=1 students=1
```
All endpoints return `{status:"success", data, message}` shape (original DIY pattern).

## Client Build Verification
- `tsc -b` → 0 errors ✅
- `vite build` → "✓ built in 13.49s" ✅

## Test Cases
| TC | Status | Notes |
|----|--------|-------|
| TC-7.1 Batch + students | ✅ API verified | Create batch → add student (phone-based) → get batch shows 1 student → people list shows lead + student |

## Files Added/Modified
- `server/db/init.js` — added batches + batch_students tables
- `server/routes/batches.js` — new (batch CRUD + students + people)
- `server/index.js` — mounted batchesRouter
- `client/src/features/batches/BatchesListPage.tsx` — new
- `client/src/features/batches/BatchStudentsPage.tsx` — new
- `client/src/features/people/PeopleListPage.tsx` — new
- `client/src/App.tsx` — added /batches, /batches/:id/students, /people routes
- `tasks/Phase-06-Batches/NOTES.md` — new

## Notes
- Batch students can be added by phone (auto-creates student user if not exists).
- People module combines leads (from landing pages) + students (users with role=student).
- Remove student uses DELETE with body (axios delete config).
