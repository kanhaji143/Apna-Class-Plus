# 📋 RFP — Apna Class Plus (Requirements)

> **Requirement source:** User ne bola — "meri requirement apko pata hai jo clone website bana rahe ho"
> => **Full Classplus DIY clone** jaisa PLAN.md + BLUEPRINT.md mein defined hai.
> Reference: https://classplusapp.com/diy/ (architecture/features seekhne ke liye)

---

## [--- REQUIREMENTS (filled) ---]

### R1. Product Overview
- Classplus DIY jaisa **white-label tutoring platform** — landing page builder + course selling + payments + batches + chat + campaigns + analytics.
- Do faces: **Teacher dashboard** (protected SPA) + **Student-facing public pages** (landing page preview, checkout — Shadow DOM mein).

### R2. Tech Stack
- **Client:** React 18 + TypeScript (Vite), Redux Toolkit, MUI + Emotion, dnd-kit, TipTap, hls.js, Framer Motion, Axios (`x-access-token` pattern), React Router.
- **Server:** Node.js + Express + SQLite (JSON columns se Mongo-jaisa document shape), JWT (HS384) access+refresh, Razorpay (test mode).
- **Pattern:** runtimeConfig.js (build ke baad env change), API-driven sidebar with feature flags (`addOnKey`), response shape `{status, data, message}`.

### R3. Modules (features)
1. **Auth:** OTP login (generateOtp → verifyOtp → user/login), refresh token, RBAC (admin/teacher/student).
2. **Dashboard:** stats cards (landingPageCount, courseCount, revenue...), onboarding "next steps", analytics stats (?day=1|7|15|30).
3. **Sidebar:** API-driven tabs config (`/v1/diy/configuration/tabs`) with subMenu, isActive, order, feature flags.
4. **Landing Page Builder:** template gallery (Webinar/Course/Form), wizard (course select), editor (drag-drop sections, props panel, theme colors/font, undo-redo), live preview (Shadow DOM iframe), publish (slug), lead capture.
5. **Courses & Content:** CRUD, folders, content types (video/PDF/live/test/youtube), reorder, video player (hls.js).
6. **Payments:** Razorpay order → checkout → HMAC verify → webhook backup; coupons; subscribe flow.
7. **Batches & People:** batch create, students add/remove, people list.
8. **Chat:** 1:1 polling-based chat.
9. **Campaigns:** create, audience cohorts, publish, sent count.
10. **Analytics:** page views, leads, conversions, revenue charts.

### R4. Non-functional
- Mobile-first, code-split per feature, LCP < 2.5s public pages, API p95 < 200ms.
- Security: bcrypt, prepared statements, DOMPurify, rate limit, CORS only client origin.

### R5. Project organization (user rule)
- **Har task ka apna folder** hoga (`tasks\Phase-XX-Name\`) taaki future mein easily update ho sake.
- Fixed workflow: RFP → TestCases → Build → Tests → Finish → Evidence.

---

## Status
| Cheez | Status |
|---|---|
| RFP.md created | ✅ |
| User requirements filled | ✅ (clone requirement — delegated) |
| TestCases.md generated | ⏳ next |
| Coding started | ⏳ Phase 1 se |
| Evidence captured | ⬜ |
