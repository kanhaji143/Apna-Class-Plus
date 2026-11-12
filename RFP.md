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
