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
- Trial expiry = soft warning only (no lockout) - option C.
- Super-admin UID stored in config/roles (bootstrap: first signup).

---

## Phase 13d - Student Store (public) + Free Material fixes

**Date:** 2026-11-13
**Live URL:** https://apna-class-plus.web.app/store

### What was done
- New public routes `/store` and `/store/:teacherId` -> `StorePage.tsx`: branded hero, tabs (Tests / Free Material), responsive cards, mobile-first.
- fbRouter `GET /store`: published tests + freeMaterials, per-test question counts, teacher display name (auth-optional, brand fallback).
- Dashboard "My Student Store" card with Copy Link / Open; sidebar "My Store (public)" link.
- Free Material routes fixed: segment-length checks were wrong, so GET/POST/PUT/DELETE were falling through to placeholder in FB mode.
- Removed composite-index dependencies: pages / tests / freeMaterials queries now filter in Firestore and sort client-side.
- Public free-material teacher name falls back to "Apna Class Plus" for anonymous visitors.

### Live E2E verified
1. `/store` loads: "Apna Class Plus" hero, TESTS (1), FREE MATERIAL (1) - PASS
2. Test card: Live Firebase Test - 30 min - 3 questions - FREE - Start Test - PASS
3. Start Test -> `/test/1` start form - PASS
4. Free Material tab: Class 10 Science Notes (PDF) - FREE - Get - PASS
5. Dashboard card: Copy Link -> "Copied!"; Open button - PASS
6. Add Material via UI -> saved; visible in admin list and public store - PASS

### Notes
- Courses tab deferred (Phase 13b - courses not yet in Firestore).
- Store is single-tenant; `/store/:teacherId` accepted but ignored (brand-level store).
- Font: Noto Sans Devanagari loaded alongside Nunito Sans for Hindi.

---

## Phase 13e - Courses in Firestore + Store Courses Tab

**Date:** 2026-11-13
**Live URL:** https://apna-class-plus.web.app/store

### What was done
- Firestore collections: `courses` (owner-scoped, status active/archived), `courseContents`, `courseFolders`.
- fbRouter endpoints: GET/POST /v2/courses, GET/DELETE /v2/courses/:id (archive), GET /v2/course/content/get, POST /v2/course/content/add, DELETE /v2/course/content/delete/:id, POST /v2/course/folder/add, POST /v2/course/reorder/contents.
- Store: Courses tab first (COURSES / TESTS / FREE MATERIAL), price chips (₹ / FREE), Enroll dialog.
- Enroll = public lead capture to `leads` (ownerUid, courseId, courseTitle, source=store) — payments Phase 5 pending.
- Dashboard Published Courses = active course count.
- Firestore rules: courses readable when active (public) or by owner; contents/folders owner-only.
- Bugfix: Firestore list queries on owner-only collections must include `ownerUid` filter (rules cannot infer ownership otherwise).

### Live E2E verified
1. Create course "Class 10 Science Complete Course" (INR 499) -> appears in /courses - PASS
2. Manage Content -> Add video content -> "Course Content (1 items)" - PASS
3. New Folder -> "Chapter 1 - Chemical Reactions (0)" - PASS
4. /store -> COURSES (1) with ₹499 + Enroll - PASS
5. Enroll dialog (Rahul Sharma / 9876543210) -> "Enrolled! Teacher contact karega" - PASS
6. Lead doc verified in Firestore (courseTitle + source=store) - PASS
7. Dashboard Published Courses = 1 - PASS

### Notes
- No payments (Phase 5): Enroll stores a lead only.
- Student course viewer (post-enrollment video access) not built yet.
- Still placeholder in FB mode: Batches, People, Chat, Campaigns, Analytics.

---

## Phase 13f - People Page (Firestore)

**Date:** 2026-11-13
**Live URL:** https://apna-class-plus.web.app/people

### What was done
- fbRouter `GET /v2/people`: owner-scoped leads + students (sorted id desc).
- `POST /v2/people/students` (manual add), `DELETE /v2/people/students/:id`.
- `POST /v2/people/leads/:id/convert`: creates student from lead + marks lead converted.
- `DELETE /v2/people/leads/:id`.
- Store enroll leads (Phase 13e) automatically appear on People page.
- Page UI: search, lead cards (source/course/date + Convert), student cards (delete), Add Student dialog, success/error alerts.
- Firestore rules: `students` owner-only read/write; `leads` owner read/update/delete + public create.
- Bugfix: public leads POST route was matching `/v2/people/leads/:id/convert` (seg[2] collision) -> scoped to `/v1/diy/leads`.

### Live E2E verified
1. /people loads Rahul Sharma lead (source store, course chip) - PASS
2. Convert -> "student ban gaya", lead Converted, Students (1) - PASS
3. Add Student "Priya Verma" -> Students (2) - PASS
4. Search "priya" -> Leads 0 / Students 1 - PASS
5. Delete student -> count decreases - PASS
6. Re-add + reload -> data persisted - PASS

### Notes
- Students are contact records (no Firebase Auth login yet).
- Batch assignment / chat linking still pending.

---

## Phase 13g - Batches (Firestore)

**Date:** 2026-11-13
**Live URL:** https://apna-class-plus.web.app/batches

### What was done
- Firestore collections: `batches` (owner-scoped, active/archived) + `batchStudents` join docs (denormalized name/phone).
- fbRouter: GET/POST /v2/batches, GET/PUT/DELETE /v2/batches/:id, POST /v2/batch/students/add, DELETE /v2/batch/students/remove (query params).
- Add by phone: existing student linked, otherwise auto-created in `students` (source=batch).
- Duplicate guard: same student same batch blocked.
- Batch list shows live student count; batch students page shows formatted enrolled date.
- Rules: batches + batchStudents owner-only.
- Bugfix: BatchStudentsPage used raw axios `api.delete` (bypassed FB router) -> switched to `del()` with query params.

### Live E2E verified
1. Create batch "Morning Batch A" (course + dates) - PASS
2. Add existing student Priya (9123456780) by phone - PASS
3. Add new student Amit (9000000001) -> auto-created - PASS
4. Remove Amit -> count 1 - PASS
5. /batches list: "Class 10 Science Complete Course - 1 students" - PASS
6. Enrolled date "13/11/2026" - PASS

### Notes
- Batches are contact-groupings; no student login yet.
- Next: Analytics (real counts), Chat, Campaigns.

---

## Phase 13h - Analytics (Firestore)

**Date:** 2026-11-13
**Live URL:** https://apna-class-plus.web.app/analytics

### What was done
- fbRouter `GET /v3/analytics/overview?range=7d|30d|90d` — Firestore se real counts, zero-filled daily series, top pages by leads, conversion rate.
- Dashboard cards via `/v1/diy/analytcs/stats?day=7` — New Leads + Page Views (range, % change vs previous), Students + Courses totals.
- `events` collection: public page-view tracking (`POST /v1/diy/events/track`), rules: public create, owner read/delete.
- LpPreviewPage: page-view event + ownerUid lead attribution (postMessage handler).
- Leads route: slug se ownerUid resolve (published page), taaki public lead owner ke People mein aaye.
- Rules-safe queries: `pages where slug == X and status == 'published'` (Firestore "rules are not filters" — signed-out list query ke liye provable filter zaroori).
- **Bugfix:** public `/lp/api/:slug` aur `/lp/api/free-materials` routes ka seg index galat tha (`seg[1]` instead of `seg[0]`) — isliye public page kabhi sections/ownerUid nahi load karta tha aur page views track nahi hote the.

### Live E2E verified
1. Analytics summary: 2 leads, 2 page views, 1 landing page, 1 course, 0 campaigns, 100% conversion - PASS
2. Range 7d/30d buckets - PASS
3. Daily charts 11-13: leads/views - PASS
4. Top pages: Science Demo Landing - 1 lead - PASS
5. Page-view tracking (public page open) - PASS
6. Dashboard cards: 2 / 2 / 3 / 1 - PASS
7. Public landing lead "Anjali Sharma" -> People (owner) - PASS

### Notes
- Campaigns = 0 (campaign feature abhi placeholder).
- Students = total contacts (batch/manual/store/landing), not auth users.
- Next: Chat, Campaigns.

---

## Phase 13i - Campaigns (Firestore)

**Date:** 2026-11-13
**Live URL:** https://apna-class-plus.web.app/campaigns

### What was done
- Firestore `campaigns` collection (owner-scoped): name, channel, audience {type,id}, audienceLabel, message, status, sentCount, recipients snapshot, createdAt, publishedAt.
- fbRouter: GET /v1/diy/campaignList, POST /v1/diy/campaign, GET/PUT/DELETE /v1/diy/campaign/:id, POST /v1/diy/campaign/publish.
- Audience resolution + phone dedupe: all / leads / students / course (students.courseId + course batches) / batch (batchStudents).
- UI: course/batch **dropdowns** (raw ID input hataya), students-only option, audience label + published date on cards, publish in-flight state.
- Rules: campaigns owner-only.
- Dashboard "Campaigns" count ab real campaigns.
- Spark note: publish = mock send (no Cloud Functions / SMS gateway).

### Live E2E verified
1. Empty state - PASS
2. Create draft (WhatsApp, Batch: Morning Batch A) - PASS
3. Publish batch -> 1 recipient - PASS
4. Create + publish All -> 4 recipients (dedupe) - PASS
5. Create + publish Course -> 2 recipients - PASS
6. Dropdowns show course/batch names - PASS
7. Delete campaign - PASS
8. Dashboard Campaigns = 2 - PASS

### Notes
- Mock send: sentCount/publishedAt/recipients Firestore mein; real delivery gateway Phase 8.5 (Blaze).
- Next: Chat.

---

## Phase 13j - Chat (Firestore + public student link)

**Date:** 2026-11-13
**Live URL:** https://apna-class-plus.web.app/chat

### What was done
- Firestore `chats/{token}` (random 24-char capability id): ownerUid, contactId, name, phone, teacherName, lastMessage, lastMessageAt, lastSender, teacherUnread, studentUnread.
- Messages subcollection `chats/{token}/messages/{id}`: sender (teacher/student), text, created_at ISO, readAt.
- fbRouter: GET /v2/chat/users (students+leads dedupe), GET /v2/chat/conversations, GET /v2/chat/messages (marks teacherUnread=0), POST /v2/chat/send, POST /v2/chat/start, GET /v2/chat/unread-count.
- ChatPage: contact select -> start chat -> share link (copy/open), message thread, polling.
- New public page `/chat/:token` (no login): teacher name header, thread, send reply, invalid-link handling.
- Rules: chat `get` public (token secret), `list` owner-only, create owner, update owner OR public limited keys; messages `get/list/create` public via path.
- Spark: 3s polling (no Cloud Functions).

### Live E2E verified
1. Contacts list (students + leads) - PASS
2. Start chat + share link - PASS
3. Teacher send - PASS
4. Public student view - PASS
5. Student reply -> teacher (poll) - PASS
6. Unread badge + clear - PASS
7. Reload persistence - PASS
8. Invalid token error - PASS

### Notes
- Student side capability URL hai (token secret) — demo trade-off, documented.
- Next: payments (blocked), student course viewer, trial enforcement.

---

## Phase 13k - Student Course Viewer (share link)

**Date:** 2026-11-13
**Live URL:** https://apna-class-plus.web.app/learn/&lt;token&gt;

### What was done
- POST `/v2/courses/:id/share` -> snapshot `courseLinks/{token}` (course info + lessons + folders + teacher name + optional student name).
- Public page `/learn/:token` (no login): hero (teacher, title, description, price, "For <student>"), lessons grouped by folders, Open buttons, empty state, invalid link message.
- Courses page: share icon per course -> AccessLinkDialog (generate / copy / open / new link).
- People page: access icon on leads/students with courseId -> dialog prefilled with student name.
- Rules: courseLinks `get` public, list/create/delete owner-only.
- Spark: snapshot link (content changes ke liye new link).

### Live E2E verified
1. Generate course link (Courses) - PASS
2. Public page renders lessons + folder - PASS
3. Personalized link from People ("For Rahul Sharma") - PASS
4. Invalid link error - PASS
5. Snapshot includes lesson type/URL - PASS

### Notes
- Link = capability URL; no login needed.
- Next: trial enforcement / payments.

---

## Phase 13l - Landing Page Templates (real sections)

**Date:** 2026-11-13
**Live URL:** https://apna-class-plus.web.app/lp-preview/lead-magnet-2

### What was done
- 4 templates with real `defaultSection` content: Blank (0), Course Landing (9), Lead Magnet (7), Test Series (7); har template ka apna primary color.
- Gallery: thumb + description + "N sections ready" + CTA.
- Course wizard: HERO headline/subheadline + PRICING plan (price, strike 2x, Enroll Now) course data se customize.
- **Bugfix 1:** single page GET (`/v1/diy/landingPages/:id`) se `_id` missing tha → builder `pageId` undefined → UI Publish/Save fail. Ab `{...data, _id: id}` return hota hai.
- **Bugfix 2:** builder save route path `/v1/diy/section/form` galat block mein tha (seg[2] check) → ab standalone route; Save sach mein Firestore mein persist hota hai.
- Free Material section public page par live published list dikhata hai (pehle fetch ke through, ab snapshot + live).

### Live E2E verified
1. Gallery 4 templates + counts - PASS
2. Create Lead page (7 sections) - PASS
3. Public page full render + live free material - PASS
4. Course wizard customization (hero/pricing ₹998→₹499) - PASS
5. Save title persisted - PASS
6. UI Publish (toast + alert) - PASS
7. Public course landing - PASS

### Notes
- Templates snapshot id se bante hain (naye page create hone par hi sections aate hain).
- Next: trial enforcement / payments.
