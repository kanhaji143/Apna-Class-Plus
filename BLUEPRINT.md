# 📘 BLUEPRINT — Apna Class Plus (Classplus DIY Clone)

> Ye document poore system ka **visual + technical blueprint** hai:
> architecture, data flow, component tree, DB schema, API contract, wireframes.
> PLAN.md mein roadmap/phases hain; yahan **kaise dikhega aur kaise flow karega** wo hai.
>
> ✅ **v2 — LIVE SESSION VERIFIED:** Logged-in account se real API responses, sidebar
> config, aur builder wizard flow dekh kar ye blueprint update kiya gaya hai (Section 11).

---

# 0. LIVE SESSION SE VERIFIED FACTS (sabse pehle — ye sab REAL hai)

Ye sab maine tumhare logged-in session ke **network capture** se nikaala (100% confirmed):

| Fact | Detail |
|---|---|
| **Backend DB** | **MongoDB** (landing page `_id: "6a8fb1e0f7506f..."` format) |
| **Auth header** | `x-access-token: eyJhbGciOiJIUzM4NCIs...` — **JWT (HS384)**, Bearer nahi! |
| **Login flow** | `POST /v1/diy/generateOtp` → `POST /v1/diy/verifyOtp` → `POST /v1/diy/user/login` — **OTP-based** |
| **Response shape** | `{ "status": "success", "data": {...}, "message": "..." }` — har API mein same |
| **Sidebar = API-driven** | `GET /v1/diy/configuration/tabs` — menu items server se aate hain (icons, slug, order, isActive, subMenu, feature flags `addOnKey: isLandingPageEnabled`) |
| **Template types** | 3 core: **Webinar Page**, **Course Page**, **Form Page** (+ carousel mein aur) |
| **Builder entry** | **Wizard flow:** template choose → course select (dropdown, `/v2/courses` se) → Next → editor |
| **i18n** | i18next — keys jaise `screens.courses.AddContent.globals.constants.literals.ViewDetails` |
| **Analytics stats** | Cards: Website sessions / Buy Now Clicks / Transactions / Revenue + `lifetimeRevenue`, `?day=1|7|15|30` filter |
| **Dashboard stats** | `landingPageCount, publishedCourseCount, bannerCount, couponCount, campaignCount, smsBalanceStatus, tutorTestCount` |
| **Onboarding** | `/v1/diy/getProgress` — "Recommended next steps" CTAs (server-driven) |

### Real sidebar structure (tabs API response se)
```
Dashboard (slug: "")
├─ Website        → Manage Pages | Domain Integration     [addOn: isWebsiteEnabled]
├─ Courses        → My Courses | Global Courses | Manage Coupons
├─ Content        → Test Portal | Free Material
├─ Your App       → Configure App | Manage Banners | Marketing Dashboard
├─ Landing Pages  → /landing-pages/list                  [addOn: isLandingPageEnabled]
├─ 1:1 Sessions   → meet-pro
├─ Chats           → chat
├─ Analytics       → analytics/sales-traffic
├─ Integrations | Campaigns | People | Team Members | Help & Support
```
👉 **Feature-flag system (`addOnKey`)** — modules on/off server se controlled. Humare clone mein bhi yahi banayenge.

### Real API endpoints (live se captured)
```
POST /v1/diy/generateOtp        POST /v1/diy/verifyOtp      POST /v1/diy/user/login
GET  /v1/diy/orgDetails          GET  /v1/diy/userDetails
GET  /v1/diy/configuration/tabs ← sidebar
GET  /v1/diy/landingPage/dashboard ← counts
GET  /v1/diy/getProgress        ← onboarding CTAs
GET  /v1/diy/analytcs/stats?day=7 ← analytics cards
GET  /v1/diy/landingPages?offset=0&limit=10 ← pagination pattern
GET  /v1/diy/helpSupport/sectionList?type=premium
GET  /v2/courses?offset=0&search=&courseStatusId=[1]&filterId=[7]&limit=20&excludeFreeCourse=1
GET  /v2/course/handlingFee     GET  /cams/banner?bannerType=2
GET  /wl/v1/classes/upcomimng?isOverview=1&filterId=5&limit=3&offset=0&startDate=...&endDate=...
```

### Builder wizard (real flow, step-by-step)
```
/landing-pages/list (search + "Create New Page")
  → /landing-pages/create        (template cards: Webinar | Course | Form)
  → /landing-pages/create/course (Step: "Select Course to be promoted" — course dropdown)
  → Next → EDITOR (sections, theme, preview)
```
⚠️ Original app mein SPA route-change pe kabhi blank render hota hai (unka bug!) —
humare clone mein React.lazy + Suspense fallback se ye fix karenge.

---

# 1. SYSTEM ARCHITECTURE (High Level)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER BROWSER                                 │
│                                                                          │
│  ┌──────────────────────┐          ┌───────────────────────────────┐  │
│  │  TEACHER APP (SPA)   │          │  STUDENT-FACING PAGES (public) │  │
│  │  /login /courses ... │          │  /lp-preview/:slug            │  │
│  │                      │          │  /subscribe/:courseId          │  │
│  │  React 18 + TS       │          │  Landing page render hota hai  │  │
│  │  Redux Toolkit       │          │  SHADOW DOM mein (CSS isolate) │  │
│  │  MUI + dnd-kit       │          │                                │  │
│  └─────────┬────────────┘          └───────────────┬───────────────┘  │
└────────────┼───────────────────────────────────────┼──────────────────┘
             │ HTTPS (JWT)                            │ public (no auth)
             ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     NODE BACKEND (Express + SQLite)                      │
│                                                                          │
│   ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌────────┐ ┌───────────────┐  │
│   │ /v1/auth │ │ /v1/diy  │ │/v2/v3   │ │/v1/diy │ │ /v3/analytics │  │
│   │ login    │ │ landing  │ │ course  │ │campaign│ │ events        │  │
│   │ refresh │ │ templates│ │ batch   │ │ chat   │ │               │  │
│   └────┬─────┘ └────┬─────┘ └────┬────┘ └───┬────┘ └──────┬────────┘  │
│        │            │            │          │             │            │
│   ┌────▼────────────▼────────────▼──────────▼─────────────▼────────┐  │
│   │  MIDDLEWARE: JWT verify → RBAC (role) → Rate limit → Logger    │  │
│   └──────────────────────────────┬─────────────────────────────────┘  │
│                                  ▼                                      │
│   ┌───────────────────────────────────────────────────────────────┐   │
│   │  DB LAYER (SQLite → Postgres) | S3 signed uploads | Webhooks  │   │
│   └───────────────────────────────────────────────────────────────┘   │
└────────────────────┬───────────────────────────┬───────────────────────┘
                     │                           │
          ┌──────────▼──────────┐    ┌───────────▼───────────────┐
          │  S3 / LOCAL UPLOADS  │    │  RAZORPAY (test mode)     │
          │  videos, pdfs, imgs  │    │  order → checkout → verify │
          └─────────────────────┘    └───────────────────────────┘
```

**Key decisions:**
- **Ek hi SPA, do faces:** teacher routes (protected) + public student routes (preview/subscribe)
- **Shadow DOM:** student landing page apne saare CSS/JS ke saath ek isolated tree mein render hota hai — teacher dashboard ke styles se zero conflict (original Classplus yahi karta hai)
- **REST API versioned:** `/v1`, `/v2`, `/v3` — original jaise hi naming

---

# 2. AUTH FLOW (Sequence)

```
Teacher                 Client (React)              Server                  DB
  │                          │                        │                    │
  │── login (phone+pass) ──► │                        │                    │
  │                          │── POST /v1/auth/login ─►│                    │
  │                          │                        │── verify bcrypt ─►│
  │                          │                        │◄── user row ──────│
  │                          │◄─ { accessToken(15m), │                     │
  │                          │     refreshToken(7d)} │                    │
  │   (access in memory, refresh in httpOnly cookie)  │                    │
  │                          │                        │                    │
  │── API call ────────────► │── Authorization: Bearer ─► 200 OK           │
  │                          │                        │                    │
  │   (15 min baad)          │                        │                    │
  │                          │── POST /v1/auth/refreshToken ─►             │
  │                          │   (401 interceptor ne auto-trigger kiya)    │
  │                          │◄─ new accessToken ──── │                    │
```

- **Axios interceptor:** 401 aaye → refreshToken call → original request retry (single-flight, parallel 401s queue)
- **RBAC:** `role: admin | teacher | student` — har route pe middleware check

---

# 3. LANDING PAGE BUILDER — DATA FLOW (Product ka dil ❤️)

```
TEMPLATES GALLERY          EDITOR SCREEN                    PREVIEW/PUBLISH
┌───────────────┐   choose   ┌────────────────────────┐    ┌─────────────────┐
│ 5 templates:  │  ────────► │ ┌──────┐ ┌──────────┐  │    │ /lp-preview/:id │
│ • Coaching    │            │ │LEFT  │ │ CANVAS   │  │ ──►│ (Shadow DOM)    │
│ • Course      │            │ │panel │ │ section  │  │live│                 │
│   Launch      │            │ │(props│ │ stack    │  │iframe                  │
│ • Test Series │            │ │ form)│ │ ┌──────┐ │  │    │  HERO           │
│ • Free Demo   │            │ │      │ │ │Hero  │◄┼─┼─drag/drop (dnd-kit)     │
│ • Personal    │            │ │theme │ │ ├──────┤ │  │    │  FEATURES       │
│               │            │ │colors│ │ │Feat. │ │ │    │  TESTIMONIALS   │
└───────────────┘            │ │fonts │ │ │ ...  │ │ │    │  PRICING        │
                             │ └──────┘ │ └──────┘ │  │    │  FOOTER         │
                             └─────────┴──────────┘  │    └─────────────────┘
                                      │  ▲                    │
                                      │  │                    │ save
                                      ▼  │                    ▼
                             ┌────────────────────┐    ┌──────────────────┐
                             │ REDUX SLICE: builder│    │ PUT /publish      │
                             │ sections[]         │    │ status=published  │
                             │ theme{colors,font} │    │ slug generate     │
                             │ activeSectionId    │    └──────────────────┘
                             │ dirty / history[]  │    (undo/redo stack)
                             └────────────────────┘
```

### Section Types (v1 — 8 sections)
| Section | Props form mein kya edit hoga |
|---|---|
| `HERO` | headline, subheadline, CTA text/link, bg image, overlay |
| `BANNER_STRIP` | scrolling text, speed, bg color |
| `FEATURES` | 3-6 cards (icon, title, desc) |
| `TESTIMONIALS` | quotes + photos + ratings slider |
| `PRICING` | plan cards (name, price, strike, features[], CTA) |
| `FAQ` | Q&A accordion items |
| `VIDEO` | embed URL (YouTube/upload) |
| `FOOTER` | links, contact, social icons |

### Theme object (global)
```json
{
  "colors": { "primary": "#6C5CE7", "secondary": "#00CEC9", "bg": "#FFFFFF" },
  "font": "Nunito Sans",
  "radius": 12, "darkMode": false
}
```

### Publish pipeline
```
save (draft) → validate sections → publish → slug auto ("my-coaching-xyz")
→ public URL: /lp-preview/my-coaching-xyz → lead capture ON
→ leads table mein entry: {name, phone, courseId} → People module mein dikhega
```

---

# 4. COMPONENT TREE (React)

```
<App>
 ├─ <ThemeProvider> (MUI)
 ├─ <BrowserRouter>
 │   ├─ <PublicRoutes>                          ← auth nahi chahiye
 │   │   ├─ <Login />
 │   │   ├─ <LpPreview />  ← Shadow DOM render
 │   │   └─ <Subscribe />   ← Razorpay checkout
 │   │
 │   └─ <ProtectedLayout>  (auth guard)
 │       ├─ <Sidebar>  (nav: Dashboard, Pages, Courses, Batches, People, Chat, Campaigns, Analytics)
 │       ├─ <Topbar>   (search, profile, logout)
 │       └─ <Outlet>
 │           ├─ <Dashboard />        (stats cards + recent activity)
 │           ├─ <LandingPagesList />
 │           │   └─ <BuilderEditor />
 │           │       ├─ <TemplateGallery />
 │           │       ├─ <SectionStack />        ← dnd-kit sortable
 │           │       │   └─ <SectionRenderer type=HERO|... />
 │           │       ├─ <PropsPanel />          ← active section ka form
 │           │       ├─ <ThemePanel />
 │           │       └─ <PreviewFrame />        ← iframe + shadow DOM
 │           ├─ <CoursesList /> ── <CourseForm />
 │           │   └─ <ContentManager />         ← folders, drag reorder
 │           │       ├─ <VideoPlayer />        ← hls.js
 │           │       └─ <PdfViewer />
 │           ├─ <BatchesList /> ── <BatchStudents />
 │           ├─ <PeopleList />
 │           ├─ <ChatPage />                   ← polling 3s
 │           ├─ <CampaignsList /> ── <CampaignForm />
 │           └─ <AnalyticsDashboard />          ← Recharts
 └─ <ReduxStore>  (slices: auth, builder, courses, ui, notifications)
```

---

# 5. DATABASE SCHEMA (ER DIAGRAM)

```
┌──────────┐ 1     N ┌─────────────┐ 1     N ┌────────────────┐
│  users   │─────────│ landing_    │─────────│  leads         │
│──────────│         │ pages       │         │ (page_id FK,   │
│ id PK    │         │─────────────│         │  course_id FK, │
│ name     │         │ id PK       │         │  name, phone)  │
│ phone    │         │ owner_id FK │         └────────────────┘
│ role     │         │ template_id │                    ▲
└────┬─────┘         │ slug UNIQUE │                    │ course interest
     │ 1             │ sections_   │                    │
     │               │   json      │                    │
     │               │ theme_json  │                    │
     │               │ status      │                    │
     │               └─────────────┘                    │
     │ 1                                                  │
     ├────────────── N ┌──────────┐ 1    N ┌──────────┐ │
     │                 │ courses  │────────│ contents │ │
     │                 │─────────│        │─────────│ │
     │                 │ id PK   │        │ type:   │ │
     │                 │ price   │        │ video/   │ │
     │                 │ currency│        │ pdf/live│ │
     │                 └────┬────┘        │ test    │ │
     │                      │ 1          └─────────┘ │
     │                      │ N                      │
     │              ┌───────┴────────┐                │
     │              │ batches        │                │
     │              │ (course_id FK) │                │
     │              └───┬────────────┘                │
     │                  │ N:M (batch_students)        │
     │                  ▼                             │
     │          ┌────────────┐    ┌──────────────┐    │
     └──────────│  students  │    │   orders     │────┘
                │ (users role│    │ (buyer_id FK,│
                │  =student) │    │  course_id,  │
                └────────────┘    │  amount,     │
                                  │  rzp_order,  │
                                  │  status)     │
                                  └──────┬───────┘
                                         │ 1:1 verify
                                  ┌──────▼───────┐    ┌──────────┐
                                  │  payments    │    │ coupons  │
                                  │ (signature   │    │ (code,   │
                                  │  verified)   │    │  pct/flat│
                                  └──────────────┘    └──────────┘

  chats(id, sender_id, receiver_id, message, read_at)
  campaigns(id, owner_id, name, audience_json, channel, status, sent_count)
  events(id, type, page_id, user_id, meta_json, created_at)  ← analytics
  sessions(token, user_id, expires_at)                       ← refresh tokens
```

---

# 6. API CONTRACT (cheat-sheet)

| Method | Endpoint | Body/Query | Response | Auth |
|---|---|---|---|---|
| POST | `/v1/auth/login` | `{phone, password}` | `{accessToken, refreshToken, user}` | ❌ |
| POST | `/v1/auth/refreshToken` | cookie | `{accessToken}` | cookie |
| GET | `/v1/diy/orgDetails` | — | `{name, logo, plan}` | ✅ |
| GET | `/v1/diy/templatePages` | — | `[{id,name,category,thumbnail}]` | ✅ |
| POST | `/v1/diy/landingPages` | `{templateId, title}` | `{id, slug}` | ✅ |
| PUT | `/v1/diy/section/form` | `{pageId, sections, theme}` | `{saved:true}` | ✅ |
| POST | `/v1/diy/landingPages/:id/publish` | — | `{publicUrl}` | ✅ |
| GET | `/lp/api/:slug` | — | `{sections, theme}` | ❌ public |
| POST | `/v1/diy/leads` | `{name, phone, courseId}` | `{ok}` | ❌ public |
| GET/POST | `/v2/courses` | course obj | list/create | ✅ |
| POST | `/v2/course/content/add` | `{courseId, type, title, url}` | `{id}` | ✅ |
| POST | `/v2/course/reorder/contents` | `[{id, order}]` | `{ok}` | ✅ |
| GET | `/v2/users/getS3SignedUrl` | `{filename, type}` | `{uploadUrl, publicUrl}` | ✅ |
| POST | `/v3/diy/pay` | `{courseId, coupon?}` | `{rzpOrderId, key, amount}` | ✅ |
| POST | `/v3/diy/pay/rzp/success` | razorpay handler payload | `{verified}` | ✅ |
| POST | `/v1/diy/webhook` | razorpay webhook + HMAC | `204` | signature |
| GET | `/v1/diy/campaignList` | — | campaigns | ✅ |
| POST | `/v1/diy/campaign/publish` | `{id}` | `{sentCount}` | ✅ |
| GET | `/v3/analytics/overview` | `?range=30d` | `{views, leads, revenue[], topPages}` | ✅ |

**Error format (standard):**
```json
{ "error": { "code": "INVALID_TOKEN", "message": "Session expired, login again" } }
```

---

# 7. PAYMENT FLOW (Razorpay)

> Auth note (live verified): original `x-access-token` header use karta hai (Bearer nahi):
> `axios.defaults.headers.common["x-access-token"] = accessToken;`
> Refresh: `POST /v1/diy/refreshToken` — silent, axios interceptor se.

```
Student clicks "Buy Now" (landing page PRICING section)
   │
   ▼
POST /v3/diy/pay  ──► server: create rzp order ──► {order_id, amount}
   │
   ▼
Client: rzp.open()  ── Razorpay checkout popup (card/UPI/netbanking)
   │
   ├── success ──► POST /v3/diy/pay/rzp/success {order, payment, signature}
   │                 │
   │                 ▼ server: HMAC verify (key_secret) → payments row
   │                 │           → orders.status = paid
   │                 │           → student ko course access grant
   │                 ▼
   │              Redirect: success page + receipt
   │
   └── fail ──► POST /v3/diy/pay/fail ──► orders.status = failed
                  (retry allowed)

Backup: /v1/diy/webhook (payment.captured) — client miss ho jaye to bhi
        order reconcile ho jaye (HMAC signature verify ke saath)
```

---

# 8. SCREEN WIREFRAMES (ASCII)

### 8.1 Dashboard
```
┌────────────────────────────────────────────────────────────────┐
│ ☰  Apna Class Plus          🔍 search            👤 Logout     │
├──────────┬─────────────────────────────────────────────────────┤
│ DASH     │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                     │
│ Pages    │  │ 12  │ │ 340 │ │₹45k │ │ 89% │  views/leads/revenue│
│ Courses  │  │pages│ │leads│ │rev  │ │conv │                     │
│ Batches  │  └─────┘ └─────┘ └─────┘ └─────┘                     │
│ People   │  ┌───────────────────────┐ ┌─────────────────────┐ │
│ Chat     │  │ Revenue chart (7d) 📈 │ │ Recent leads table  │ │
│ Campaigns│  │  ╭─╮   ╭╮             │ │ Ravi 98xxx course-1 │ │
│ Analytics│  │ ╭╯ ╰╮╭─╯╰╮           │ │ Meena 97xxx course-2│ │
│          │  └───────────────────────┘ └─────────────────────┘ │
└──────────┴─────────────────────────────────────────────────────┘
```

### 8.2 Builder Editor (3-column)
```
┌─────────────────────────────────────────────────────────────────┐
│ ◀ Back │ My Coaching Page      [Undo↩ Redo↪]  💾  👁 Preview  ✔Publish│
├──────────┬──────────────────────────────────┬────────────────────┤
│ LEFT     │ CANVAS (sections stack)           │ RIGHT              │
│          │                                  │                    │
│ SECTION  │  ┌─ HERO ──────────────────⠿─┐   │ PROPS (active)     │
│ LIBRARY  │  │ Best Maths Coaching!       │   │ ┌──────────────┐  │
│          │  │ [Start Learning]           │   │ │ Headline     ✏│  │
│ (+ Hero) │  └───────────────────────────┘   │ │ Subheadline  ✏│  │
│ (+ Feat) │  ┌─ FEATURES ───────────────⠿─┐  │ │ CTA text     ✏│  │
│ (+ Testi)│  │ 🎯  📚  ⏱                   │  │ │ BG image     📁│  │
│ (+ Price)│  │ Doubt Live PDFs Tests      │  │ └──────────────┘  │
│ (+ FAQ)  │  └───────────────────────────┘  │                    │
│ (+ Video)│  ┌─ PRICING ────────────────⠿─┐  │ THEME             │
│ (+ Foot) │  │ ₹499   ₹999   ₹1999        │  │ 🎨 primary color  │
│          │  │ [Buy]  [Buy]  [Buy]        │  │ 🔤 font family    │
│ drag &  │  └───────────────────────────┘  │ 🌙 dark toggle     │
│ drop me │        ▲ drag to reorder         │                    │
│ canvas  │                                  │                    │
│ me!     │                                  │                    │
└──────────┴──────────────────────────────────┴────────────────────┘
```

### 8.3 Public Landing Page (student view — Shadow DOM)
```
┌───────────────────────────────────────┐
│  🏆 BEST MATHS COACHING IN DELHI      │  ← HERO + CTA
│  NCERT Class 10 — Pass + Topper Mode  │
│         [ Start Learning ]            │
├───────────────────────────────────────┤
│ ⭐ Free demo lectures every Sunday     │  ← BANNER strip
├───────────────────────────────────────┤
│  🎯  Doubt Sessions                    │  ← FEATURES
│  📚  NCERT PDFs          ⏱ Test Series │
├───────────────────────────────────────┤
│  ❝ Maine 68% se 92% kiya! ❞  — Ravi   │  ← TESTIMONIALS
├───────────────────────────────────────┤
│  Basic ₹499 | Pro ₹999 | Elite ₹1999  │  ← PRICING → Buy → pay
├───────────────────────────────────────┤
│  Q: Kya demo free hai? A: Haan!       │  ← FAQ
├───────────────────────────────────────┤
│  📞 98xxx | instagram | telegram       │  ← FOOTER
└───────────────────────────────────────┘
   Lead form popup: [Name] [Phone] [→]
   → leads table → People module
```

### 8.4 Checkout (/subscribe/:id)
```
┌────────────────────────────┐
│  Course: Class 10 Maths    │
│  ₹999  (₹1499 strike)     │
│  Coupon: [DIWALI50]  ✔ -50%│
│  Payable: ₹499             │
│  [ Pay with Razorpay 💳 ] │──► popup → success/fail
└────────────────────────────┘
```

---

# 9. SECURITY CHECKLIST

- ✅ Password: bcrypt (12 rounds)
- ✅ JWT: access 15 min in-memory; refresh 7 din httpOnly cookie
- ✅ RBAC middleware per route (`admin/teacher/student`)
- ✅ Razorpay webhook: **HMAC-SHA256 signature verify** (mandatory)
- ✅ S3 upload: sirf presigned URL se (server se direct upload nahi)
- ✅ Rate limit: login 5/min, APIs 100/min
- ✅ Input validation: zod (client) + express-validator (server)
- ✅ SQL injection: prepared statements (SQLite/Postgres)
- ✅ XSS: Draft/TipTap output sanitize (DOMPurify) before render
- ✅ CORS: only client origin

---

# 10. NON-FUNCTIONAL

| Metric | Target |
|---|---|
| Landing page LCP (public) | < 2.5s (lazy sections, optimized images) |
| API p95 | < 200ms (SQLite dev / Postgres prod) |
| Bundle size | < 2MB initial (code-split per feature via React.lazy) |
| Uptime approach | stateless server, SQLite single-writer (dev), Postgres (prod) |
| Mobile-first | builder canvas tablet pe bhi usable (dnd-kit touch support) |

---

## ✅ Blueprint complete — Next: "Phase 1 start karo" bolo to scaffold banana shuru 🚀
