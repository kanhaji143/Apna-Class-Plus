# 🚀 Apna Class Plus — Classplus DIY Clone

> **Goal:** classplusapp.com/diy jaisa full "Do-It-Yourself" tutoring platform —
> Landing Page Builder + Course Selling + Payments + Batches + Chat + Campaigns + Analytics.
>
> **Source:** classplusapp.com/diy ke live HTML/JS bundle (7.46 MB) ka reverse-engineering analysis.
> **Date:** 27 Oct 2026

---

## 1. Original Classplus DIY — Tech Stack (reverse-engineered)

| Cheez | Original mein kya hai | Hum kya use karenge | Kyun |
|---|---|---|---|
| Frontend framework | React 18.3.1 + TypeScript (CRA/Webpack) | **React 18 + TypeScript (Vite)** | Same code-style, 10x faster dev build |
| State management | Redux + Redux Saga + Immutable.js | **Redux Toolkit (RTK) + RTK Query** | Saga outdated hai; RTK modern standard hai |
| UI library | Material UI (v4) + Semantic UI toastr | **MUI v5/v6 + Emotion** | Same look & feel |
| Animation | Framer Motion | Framer Motion | same |
| Drag & Drop | react-beautiful-dnd (⚠️ deprecated) | **@dnd-kit/core** | beautiful-dnd ab maintain nahi hota |
| Rich text | Draft.js | **TipTap (headless, modern)** | Draft.js deprecated hai; Draft-jaisa hi output |
| Networking | Axios + interceptors | Axios + interceptors | same pattern |
| Video | Video.js + HLS.js | **hls.js + custom player** | lighter |
| Uploads | Uppy + S3 signed URLs | **Direct S3 presigned URL flow** | simple, same security |
| Payments | Razorpay checkout + webhooks | Razorpay checkout + webhooks | same |
| Live classes | Zoom SDK | Zoom Meeting SDK | same |
| CSS | CSS Modules | **CSS Modules + MUI sx** | same approach |
| PWA | CRA PWA | **vite-plugin-pwa** | same result |
| Monitoring | Sentry + Instana | Sentry (optional) | — |
| Analytics | GA4 + GTM + WebEngage | GA4 (optional) | — |
| Backend | diy-api.classplusapp.com (unknown, REST) | **Node.js + Express + SQLite** (dev) → Postgres (prod) | poora control, same REST shape |

### Runtime config pattern (original se seekha)
Original ek alag `runtimeConfig.js` file rakhta hai jo build ke baad bhi change ho sakti hai:
```js
window.runConfig = {
  API_BASE_URL: "http://localhost:4000",
  DIY_BASE_URL: "http://localhost:5173",
  RAZORPAY_KEY: "rzp_test_xxx",
  APP_ENVIRONMENT: "development",
};
```
Hum bhi yahi pattern use karenge — `public/runtimeConfig.js` (git-ignored) + `runtimeConfig.example.js`.

---

## 2. Features (Original ke routes se mapped)

### Pages (React Router)
```
/login                → Login (phone/OTP + password)
/                     → Dashboard (home)
/landing-pages        → Landing Page Builder (list + editor)
/lp-preview/:id       → Student-facing landing page preview (Shadow DOM)
/website              → Mini-website manager
/courses              → Course list + create
/content/:courseId    → Content manager (videos, PDFs, live, tests)
/batches              → Batches manager
/people               → Students/teachers manager
/chat                 → Chat module
/campaigns            → Marketing campaigns
/analytics            → Analytics dashboard
/subscribe/:id        → Student checkout + payment
/test-preview/:testId → Test player
/student-profile      → Student profile
/unsupported          → Old browser fallback
```

### Core Modules
1. **Landing Page Builder** (heart of the product)
   - Templates gallery (v1: 5 templates)
   - Section-based: Hero, Banner, Features, Testimonials, Pricing, FAQ, Footer, Custom HTML
   - Drag-drop reorder, per-section props form, color palette + font picker
   - Live preview (iframe + Shadow DOM — CSS isolation, original wahi karta hai)
   - Publish → public URL
2. **Courses & Content**
   - Course CRUD, chapters/folders, content types: video, PDF, live, test, YouTube
   - Reorder (drag), bulk import (CSV), linked tests
3. **Payments (Razorpay)**
   - Order create → Razorpay checkout → success/fail → webhook verify (HMAC)
   - Coupons, bulk subscribe, wallet (Phase 8+)
4. **Batches & People**
   - Batch create, students add/remove, attendance basics
5. **Chat**
   - Polling-based 1:1 chat (Phase 6 → WebSocket upgrade)
6. **Campaigns**
   - Campaign create, audience cohorts (course-wise), publish, SMS/WhatsApp log
7. **Analytics**
   - Leads, page views, conversions, revenue charts (Recharts)

---

## 3. Data Models (SQLite)

```sql
users(id, name, phone, email, role[admin|teacher|student], password_hash, created_at)
sessions(token, user_id, expires_at)                -- refresh token pattern
templates(id, name, category, sections_json)
landing_pages(id, owner_id, template_id, slug, title, sections_json, theme_json, status[draft|published], published_at)
leads(id, page_id, name, phone, course_id, created_at)
courses(id, owner_id, title, price, currency, description, cover, status)
contents(id, course_id, folder_id, type[video|pdf|live|test|youtube], title, url, order, duration)
batches(id, owner_id, course_id, name, schedule_json)
batch_students(batch_id, student_id, status)
orders(id, buyer_id, course_id, amount, rzp_order_id, status, created_at)
payments(id, order_id, rzp_payment_id, signature_verified, amount, method)
chats(id, sender_id, receiver_id, message, created_at, read_at)
campaigns(id, owner_id, name, audience_json, channel, message, status, sent_count)
events(id, type, page_id, user_id, meta_json, created_at)  -- analytics
```

---

## 4. API Design (original ke endpoints jaisa hi shape)

```
POST /v1/auth/login          POST /v1/auth/refreshToken
GET  /v1/diy/orgDetails
GET  /v1/diy/templatePages   POST /v1/diy/landingPages   PUT /v1/diy/section/form
POST /v1/diy/landingPages/:id/publish
GET  /v2/courses             POST /v2/course/content/add  PUT /v2/course/content/edit/:id
POST /v2/course/reorder/contents   GET /v2/users/getS3SignedUrl
POST /v3/diy/pay (order)     POST /v3/diy/pay/rzp/success   POST /v1/diy/webhook
POST /v2/batches/create      POST /v2/chats/conversations/add
GET  /v1/diy/campaignList    POST /v1/diy/campaign/publish
GET  /v3/analytics/overview
```

Auth: JWT access (15 min) + refresh token (7 din) — original `/v1/diy/refreshToken` jaisa.

---

## 5. Folder Structure

```
Apna Class Plus/
├── PLAN.md                 ← ye document
├── client/                 (React frontend)
│   ├── public/
│   │   ├── runtimeConfig.example.js
│   │   └── manifest.json
│   ├── src/
│   │   ├── api/            (axios instance, endpoints per module)
│   │   ├── app/            (store, router, theme)
│   │   ├── components/     (common: Button, Modal, Loader...)
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── builder/    (sections/, templates/, Editor, Preview)
│   │   │   ├── courses/
│   │   │   ├── payments/
│   │   │   ├── batches/
│   │   │   ├── chat/
│   │   │   ├── campaigns/
│   │   │   └── analytics/
│   │   ├── hooks/
│   │   └── styles/
│   └── vite.config.ts
├── server/                 (Node + Express + SQLite)
│   ├── index.js
│   ├── routes/  (auth, diy, courses, pay, campaigns, chat)
│   ├── db/  (schema.sql, seed.js)
│   └── lib/ (jwt, razorpay, s3)
└── README.md
```

---

## 6. Phases (milestones)

| Phase | Deliverable | Est. |
|---|---|---|
| **1** | Scaffold: Vite + React 18 + TS + RTK + MUI + Router + folder structure + runtimeConfig pattern | 1 session |
| **2** | Auth (login/refresh) + Dashboard shell (sidebar, topbar, protected routes) + mock server chalu | 1-2 session |
| **3** | 🔥 **Landing Page Builder** — templates, dnd-kit drag-drop, section props forms, live preview (Shadow DOM), publish | 3-4 session |
| **4** | Courses + Content manager (folders, video player, reorder, PDF viewer) | 2-3 session |
| **5** | Razorpay payments: checkout, order, webhook, coupon, "subscribe" student flow | 2 session |
| **6** | Batches + People + Chat (polling) | 2-3 session |
| **7** | Campaigns + Leads capture | 1-2 session |
| **8** | Analytics dashboard + GA4 events + PWA + polish | 2 session |
| **9 (optional)** | Zoom live classes, custom domain, Sentry, WebEngage-type engagement | future |

**Total estimated: ~15-20 working sessions.**

---

## 7. Legal Note ⚖️
- Ye clone **architecture/features seekhne** ke liye hai — Classplus ka code copy nahi kiya ja sakta (proprietary).
- Assets/logo/template designs khud ke banenge.
- Razorpay test mode mein develop karenge (live key baad mein).

---

## 8. Next Step
✅ Ye plan approve ho gaya to main **Phase 1 (scaffold)** se shuru karta hoon —
batao: "Phase 1 start karo" 🚀
