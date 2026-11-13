# ðŸ“‹ RFP â€” Apna Class Plus (Requirements)

> **Requirement source:** User ne bola â€” "meri requirement apko pata hai jo clone website bana rahe ho"
> => **Full Classplus DIY clone** jaisa PLAN.md + BLUEPRINT.md mein defined hai.
> Reference: https://classplusapp.com/diy/ (architecture/features seekhne ke liye)

---

## [--- REQUIREMENTS (filled) ---]

### R1. Product Overview
- Classplus DIY jaisa **white-label tutoring platform** â€” landing page builder + course selling + payments + batches + chat + campaigns + analytics.
- Do faces: **Teacher dashboard** (protected SPA) + **Student-facing public pages** (landing page preview, checkout â€” Shadow DOM mein).

### R2. Tech Stack
- **Client:** React 18 + TypeScript (Vite), Redux Toolkit, MUI + Emotion, dnd-kit, TipTap, hls.js, Framer Motion, Axios (`x-access-token` pattern), React Router.
- **Server:** Node.js + Express + SQLite (JSON columns se Mongo-jaisa document shape), JWT (HS384) access+refresh, Razorpay (test mode).
- **Pattern:** runtimeConfig.js (build ke baad env change), API-driven sidebar with feature flags (`addOnKey`), response shape `{status, data, message}`.

### R3. Modules (features)
1. **Auth:** OTP login (generateOtp â†’ verifyOtp â†’ user/login), refresh token, RBAC (admin/teacher/student).
2. **Dashboard:** stats cards (landingPageCount, courseCount, revenue...), onboarding "next steps", analytics stats (?day=1|7|15|30).
3. **Sidebar:** API-driven tabs config (`/v1/diy/configuration/tabs`) with subMenu, isActive, order, feature flags.
4. **Landing Page Builder:** template gallery (Webinar/Course/Form), wizard (course select), editor (drag-drop sections, props panel, theme colors/font, undo-redo), live preview (Shadow DOM iframe), publish (slug), lead capture.
5. **Courses & Content:** CRUD, folders, content types (video/PDF/live/test/youtube), reorder, video player (hls.js).
6. **Payments:** Razorpay order â†’ checkout â†’ HMAC verify â†’ webhook backup; coupons; subscribe flow.
7. **Batches & People:** batch create, students add/remove, people list.
8. **Chat:** 1:1 polling-based chat.
9. **Campaigns:** create, audience cohorts, publish, sent count.
10. **Analytics:** page views, leads, conversions, revenue charts.

### R4. Non-functional
- Mobile-first, code-split per feature, LCP < 2.5s public pages, API p95 < 200ms.
- Security: bcrypt, prepared statements, DOMPurify, rate limit, CORS only client origin.

### R5. Project organization (user rule)
- **Har task ka apna folder** hoga (`tasks\Phase-XX-Name\`) taaki future mein easily update ho sake.
- Fixed workflow: RFP â†’ TestCases â†’ Build â†’ Tests â†’ Finish â†’ Evidence.

---

## Status
| Cheez | Status |
|---|---|
| RFP.md created | âœ… |
| User requirements filled | âœ… (clone requirement â€” delegated) |
| TestCases.md generated | â³ next |
| Coding started | â³ Phase 1 se |
| Evidence captured | â¬œ |

---

## Phase 13c — Roles + 7-Day Trial (user requirements, chat)

**Date:** 2026-11-12

### Requirements
1. **Role system (3-tier):** teacher (default signup), admin (institute owner), superadmin (developer). Single-tenant (sab ek "Apna Class Plus" brand ke under).
2. **Super-admin bootstrap:** pehla signup superadmin banega (config/roles doc se). Super-admin hi roles change kar sakta hai.
3. **7-day trial:** har new signup (teacher) ko 7-day trial milta hai (trialStart=now, trialEnd=now+7d, plan='trial'). Super-admin exempt (plan='active', no trial).
4. **Trial expiry = soft warning (option C):** expired pe login allowed, data read-only nahi — banner + continue (no hard lockout). Naya create/edit allowed with warning? User said "C shayd ye class me hain" = soft warning banner + continue.
5. **Admin console:** admin/superadmin dekh sake saare teachers + unka trial status (days left / expired).
6. **Trial extend:** admin/superadmin kisi teacher ka trial +7 days extend kar sake.
7. **Role-based UI gating:** sidebar/pages by role (teacher sees own data; admin/superadmin sees all + management pages).
8. **Firestore rules:** super-admin (config/roles.superAdminUid) can update any user's role/plan; admin can extend trial of teachers; teachers own data only.

### Notes
- Payment gateway abhi nahi (Phase 5 skipped) — expiry = soft warning only, no auto-charge.
- Cloud Functions nahi (Spark) — role changes client-side with rules guard (get on config/roles).

---

## Phase 13d — Student Store Page (user requirements, chat)

**Date:** 2026-11-13

### Requirements
1. Public student store page jaise Classplus (web.classplusapp.com/store/home) — single-tenant version.
2. Route: /store/:teacherId (public, no login).
3. Tabs: Tests | Free Material (Courses tab baad mein — Phase 13b).
4. Test cards: title, description, duration, question count, "Start Test" → /test/:id.
5. Material cards: type icon (PDF/Video/YouTube), title, description, "Get" → external link.
6. Hero header with teacher name + branding.
7. Mobile-first, Nunito Sans + Noto Sans Devanagari fonts.
8. Teacher apne dashboard se store link copy kar sake.

---

## Phase 13e - Courses in Firestore + Store Courses Tab (user requirements, chat)

**Date:** 2026-11-13

### Requirements
1. Courses ko Firestore pe migrate karo (abhi sirf SQLite/local mode mein the, FB mode mein placeholder).
2. Courses page: Create New Course, list, archive (status = archived), Manage Content.
3. Content Manager: content add/delete + folders add + drag reorder — sab Firestore pe.
4. Public store mein Courses tab: title, description, price (₹/FREE), Enroll CTA.
5. Enroll = lead capture (payments Phase 5 skipped) — naam + phone → `leads` collection (owner-scoped).
6. Dashboard "Published Courses" count = active courses.
7. Firestore rules: courses public read when active; contents/folders owner-only.
8. Store dismiss-free (no composite indexes) — client-side sorting.

---

## Phase 13f - People Page (Firestore, user requirements, chat)

**Date:** 2026-11-13

### Requirements
1. People page Firestore pe: Leads + Students lists (owner-scoped).
2. Lead cards: name, phone, source, course, date, converted state.
3. Convert lead -> student (lead pe "Converted" mark).
4. Add Student manually (name + phone).
5. Delete lead / student.
6. Search by name or phone.
7. Store/landing-page enroll leads automatically yahan dikhein.
8. Firestore rules: students owner-only; leads owner read/update/delete + public create.

---

## Phase 13g - Batches (Firestore, user requirements, chat)

**Date:** 2026-11-13

### Requirements
1. Batches ko Firestore pe migrate karo (list, create, update, archive).
2. Batch cards: name, course title, student count, start date, status.
3. Manage Students page: batch students list + add by phone + remove.
4. Add by phone: existing student link karo, warna naya student auto-create.
5. Duplicate student in same batch block.
6. Firestore rules: batches + batchStudents owner-only.
7. Delete student from batch via query-param route (FB mode compatible).

---

## Phase 13h - Analytics (Firestore, real counts)

**Date:** 2026-11-13

### Requirements
1. `/analytics` page ko Firestore se real data do — koi placeholder/sample nahi.
2. Summary cards: Total Leads, Page Views, Landing Pages, Courses, Campaigns, Conversion Rate.
3. Range selector (7d / 30d / 90d / all) — daily series continuous (zero-filled).
4. Daily Leads + Daily Page Views charts (recharts) + Top Landing Pages by leads.
5. Dashboard analytics cards (last 7 days): New Leads, Page Views, Students, Courses + % change.
6. Public landing page par page-view event track karo (owner-scoped).
7. Public landing page se aaye lead ka owner resolve karo (slug se), taaki People + analytics mein dikhe.
8. Firestore rules: `events` public create, owner-only read/delete.
9. Bugfix: public `/lp/api/:slug` route match (seg index) + rules-safe published filter.

---

## Phase 13i - Campaigns (Firestore, mock send)

**Date:** 2026-11-13

### Requirements
1. Campaigns ko Firestore pe migrate karo (list, create, update, publish, delete).
2. Audience options: All (Students + Leads), Leads only, Students only, Course students, Batch students.
3. Course/Batch audience ke liye **dropdown** (raw ID nahi) — course title / batch name dikhe.
4. Publish par recipients resolve + **phone se dedupe**, `sentCount`, `publishedAt`, recipients snapshot.
5. Cards: name, status, channel, sent count, audience label, published date, message preview.
6. Firestore rules: campaigns owner-only.
7. Dashboard "Campaigns" count real campaigns se aaye (tests+materials mix nahi).
8. Spark plan note: publish = **mock send** (real SMS/Email/WhatsApp gateway nahi — Blaze/Cloud Functions ke bina).

---

## Phase 13j - Chat (Firestore + public student link)

**Date:** 2026-11-13

### Requirements
1. Chat ko Firestore pe migrate karo: conversations + messages.
2. Teacher ke contacts: students + leads (phone se dedupe).
3. Contact select → chat start → **shareable public link** (`/chat/<token>`).
4. Teacher message bheje, conversation list mein last message + **unread badge** dikhe.
5. Student bina login public link se reply kar sake (random token = capability URL).
6. Thread khulte hi unread clear ho.
7. Rules: chat doc `get` public (token secret), `list` owner-only; messages public via path; owner update.
8. Spark note: realtime = 3s polling (Cloud Functions/listeners ke bina bhi kaam).

---

## Phase 13k - Student Course Viewer (share link)

**Date:** 2026-11-13

### Requirements
1. Teacher course ka **access link** bana sake — `/learn/<token>` (student bina login).
2. Link par course ka **content snapshot**: lessons (type, title, URL) + folders.
3. Courses page pe share button; People page pe enrolled contact ke liye access button (naam prefilled).
4. Public viewer: teacher name, course title/description/price, lessons folder-wise, "Open" action, "For <student>" badge.
5. Invalid/expired link par friendly message; empty content state.
6. Firestore rules: `courseLinks` public `get`, owner-only list/create/delete.
7. Spark note: content snapshot link banate waqt — content update ke liye naya link generate karna hoga.

---

## Phase 13l - Landing Page Templates (real sections)

**Date:** 2026-11-13

### Requirements
1. Templates mein **real sections** ho — abhi "Course Landing" khali tha.
2. 4 templates: Blank, Course Landing, Lead Magnet, Test Series Landing (apna-apna primary color).
3. Gallery mein thumb, description, sections count, CTA button dikhe.
4. Course wizard se course select karo → Hero (title/description) + Pricing (₹price, strike 2x, Enroll Now) customize ho.
5. Builder **Save** aur **Publish** UI se kaam kare (FB mode).
6. Public landing page saare sections + lead form render kare; Free Material live published list se aaye.
7. Rules: pages `status == published` public read (unchanged).

---

## Phase 13m - Progress Tracking (course viewer)

**Date:** 2026-11-13

### Requirements
1. LearnPage par har lesson ka "Mark done" toggle + "Done" state.
2. Header mein progress bar + % + "X/Y done".
3. Progress **localStorage** (device) + Firestore `courseLinks.progress` (cross-device) dono mein sync.
4. Rules: public update sirf `progress` key allowed (baaki fields locked).
5. Purane links ke liye bhi kaam kare (no migration).

---

## Phase 13n - Teacher Progress Dashboard + Sidebar Tabs

**Date:** 2026-11-13

### Requirements
1. Teacher ko student-wise completion dikhani hai — `/progress` page.
2. Summary cards: shared links count, average completion %, 100% completed links.
3. Har link: course title, student name (ya "General link"), `X/Y lessons`, progress bar, %, date.
4. "Open" se student view preview.
5. Empty state.
6. **Sidebar tabs FB mode mein** — `/v1/diy/configuration/tabs` abhi fallback `[]` de raha tha (sidebar khaali). Original DIY jaisa tab set return karo.
7. Rules unchanged (`courseLinks` list owner-only already).

---

## Phase 13o - Comprehension (passage + sub-questions)

**Date:** 2026-11-13

### Requirements
1. Test editor mein **Comprehension** question type — passage container (marks 0).
2. Passage ke neeche **sub-questions** (mcq/truefalse/objective/subjective) — "Passage (Comprehension)" select se attach.
3. Editor list mein passage header + indented sub-questions; numbering sirf answerable questions ki.
4. Public player: sub-question ke saath **passage context box** (Show/Hide), bilingual (English default, Hindi fallback).
5. Passage count/scoring mein shamil nahi (total sirf sub-questions ke marks).
6. Passage delete → sub-questions ungroup (parent_id null).
7. Rules unchanged (questions subcollection pehle se owner/public rules).

---

## Phase 13p - Auto Access Link on Lead Convert

**Date:** 2026-11-13

### Requirements
1. Jab teacher People page se **lead convert** kare aur lead mein `courseId` ho, to **automatic course access link** generate ho.
2. Convert ke baad dialog auto-open — student name prefilled + link (copy / open / new link).
3. Link wahi snapshot flow (`courseLinks`) use kare — student bina login course dekhe.
4. Share route aur convert route ek hi helper (`createCourseLink`) se chale.
5. Store enroll → lead → teacher convert → learning link ka flow documented.

---

## Phase 13q - Onboarding Links (learning + chat)

**Date:** 2026-11-13

### Requirements
1. Lead convert ke baad **Onboarding Dialog** — 📚 Course access link + 💬 Chat link dono.
2. Chat link auto-create (student ↔ teacher), student view mein teacher ka naam.
3. Dono links copy/open; learning page "For <student>"; chat page teacher name ke saath.
4. Teacher chat page par naya conversation dikhe.
5. Shared helper (`ensureChatForContact`) chat routes + convert dono mein.

---

## Phase 13r - Coupons (discount codes)

**Date:** 2026-11-13

### Requirements
1. Teacher coupon bana sake: code, discount (percent/flat), course (ya all), expiry, status.
2. Coupons page `/coupons` + sidebar tab; list mein usage count.
3. Store enroll dialog mein **coupon code field + Apply** → discounted price turant dikhe.
4. Lead mein `couponCode` save; usage count leads se.
5. Rules: coupons public read sirf `status == 'active'` (store validation ke liye); owner-only write.
6. Dashboard "Coupons" count real.

---

## Phase 13s - Final QA, README & Demo Seed

**Date:** 2026-11-13

### Requirements
1. Project root mein **README.md** — setup, local dev, live deploy (Spark), credentials, features, limitations.
2. Dashboard par **"Seed Demo Data"** button — ek click mein course/test/coupon/page/free material/lead (jo missing ho).
3. Seed idempotent ho (dobara click par "already exists").
4. **QA sweep** — saare 18 pages ek-ek karke load ho, koi crash/console error na.
5. QA mein mile bugs fix ho (Landing Pages list Timestamp crash).

---

## Phase 13t - Mobile Responsive Polish

**Date:** 2026-11-13

### Requirements
1. Sidebar mobile pe **temporary drawer + hamburger** (desktop pe permanent) — `useMediaQuery('(max-width:768px)')`.
2. Mobile AppBar compact (chhota Logout, user chip shrink).
3. Main padding mobile pe kam (`xs:1.5`), dialogs chhote screen pe fit (margin 8px).
4. Flex rows wrap ho (Test editor, Content manager, Learn page, Test player, Public free material).
5. Phone inputs `type="tel"` (Store, People, Batches).
6. Desktop regression na aaye.

---

## Phase 13u - Payments Integration (Razorpay + mock mode)

**Date:** 2026-11-13

### Requirements
1. Store enroll paid course par **order** bane (amount, discount, couponCode).
2. **Checkout dialog** — real Razorpay Checkout.js (key configured ho to) ya **Test Mode mock** (placeholder key `rzp_test_XXXX...`).
3. Payment complete → order `paid` + **paid lead** (People mein).
4. `/orders` page — Revenue (paid), Paid Orders, Pending + order cards.
5. Analytics mein revenue (daily chart + dashboard Revenue card).
6. Rules: orders public create, owner read/update.
7. Verification ke dauran mile bugs fix (complete route path, pubPost generic).
