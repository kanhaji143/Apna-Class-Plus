# Phase 13 â€” Firebase Spark Live Migration (Core) â€” Execution Evidence

**Date:** 2026-11-12 (session)
**Live URL:** https://apna-class-plus.web.app
**Firebase project:** `apna-class-plus` (Spark plan, region asia-south1)
**Auth:** Email/Password (Spark â€” phone OTP needs Blaze)

## What was done
- Firebase project `apna-class-plus` created via CLI; Firestore DB provisioned (Mumbai/asia-south1); Email/Password auth enabled; Web app registered.
- Client data layer rewritten to Firestore SDK behind a runtime flag `FIREBASE_MODE` (local Express+SQLite flow untouched when false).
- `client/src/firebase/fb.ts` (init + numeric-id counters), `client/src/firebase/fbRouter.ts` (endpointâ†’Firestore router, client-side scoring, bulk parser mirror), `client/src/api/client.ts` (FB routing), `authSlice`/`LoginPage` (email/password + signup), `TestTakePage`/`PublicFreeMaterialsPage`/`LpPreviewPage` (direct calls routed).
- Firestore security rules (`client/firestore.rules`): owner-based writes, public read for published tests/materials/pages, public attempt create + rated-only update, public lead create.
- `firebase.json` hosting (SPA rewrite) + firestore rules; prod build with `FIREBASE_MODE: true`; `firebase deploy --only hosting,firestore:rules`.

## Live E2E verified (browser automation)
1. Signup (email/password teacher) â†’ dashboard loads from Firestore âœ…
2. Test Portal â†’ Create Test (Firestore doc id 1) âœ…
3. Bulk Import (3 questions: bilingual MCQ + Hindi MCQ + objective) â†’ "3 questions import ho gaye!" âœ…
4. Publish â†’ status Published âœ…
5. Student player `/test/1`: palette legend, bilingual dropdown, 3 questions âœ…
6. Answer all (MCQ New Delhi, MCQ à¤ªà¥‚à¤°à¥à¤µ, objective 5) â†’ Submit â†’ **5/5, 100%, all Correct** âœ…
7. Palette 4-state + legend verified in player âœ…

## Known follow-ups (Phase 13b)
- Free Material add dialog (UI automation flaky â€” code path identical to verified local flow).
- Landing page create/publish/public view (builder wired via router; needs manual live check).
- Dashboard stats are approximate (counts only; courses/coupons/campaigns = 0 on Spark core).
- Courses/Batches/People/Chat/Campaigns/Analytics gated (placeholder data) â€” to be migrated in Phase 13b.
- Scoring is client-side (demo trade-off â€” answers inspectable in Firestore rules allow public read of published questions).
- Subjective grading route mirrors server logic (collection-group lookup) â€” not yet live-tested.

## Deploy artifacts
- Hosting URL: https://apna-class-plus.web.app
- Firestore rules released; DB: apna-class-plus (asia-south1)
- Auth: Email/Password enabled

---

## Phase 13c — Roles + 7-Day Trial (Execution Evidence)

**Date:** 2026-11-12 (session)
**Live URL:** https://apna-class-plus.web.app

### What was done
- users/{uid} doc now stores ole, plan, 	rialStart, 	rialEnd, instituteId.
- Signup bootstrap: first signup becomes superadmin (config/roles doc created); others get 	eacher + 7-day trial.
- FbUser + authSlice User carry ole/plan/	rialEnd.
- New /admin page (AdminPage): user list with role badge, plan chip, trial days left, role change (superadmin only), +7 days extend.
- Sidebar shows "Admin (Users & Trials)" link for admin/superadmin.
- Dashboard trial banner (soft warning — no hard lockout per user choice "C").
- Firestore rules: isSuperAdmin() via config/roles; llow list/get/update split; config/roles bootstrap write allowed.
- bRouter routes: /v3/users (GET), /v3/users/:uid/role (PUT), /v3/users/:uid/extend-trial (POST).

### Live E2E verified
1. New signup "Trial Teacher" → dashboard shows "🎁 Trial: 7 din baaki hain" ✅
2. Super-admin (teacher@apnatest.in, promoted) → /admin shows both users with role/plan/trial ✅
3. Role dropdown + +7 days extend button present ✅
4. Trial banner renders correctly for trial users, hidden for superadmin ✅

### Notes
- Single-tenant (sab ek "Apna Class Plus" brand).
- Trial expiry = soft warning only (no lockout) — option C.
- Super-admin UID stored in config/roles (bootstrap: first signup).
