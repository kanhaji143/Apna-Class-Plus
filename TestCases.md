# 🧪 TestCases — Apna Class Plus

> Generated from `RFP.md` (R1–R5). Har test case mein: scenario, steps, expected outcome, validation points.
> **Execution proof `Evidence\` folder mein store hoga.**

---

## Module 1: Auth (R3.1)

### TC-1.1 OTP Login — valid user
- **Scenario:** Registered teacher phone se login karta hai.
- **Steps:**
  1. `/login` page kholo
  2. Phone number daalo → "Send OTP" click
  3. `POST /v1/diy/generateOtp` call ho (network mein verify)
  4. OTP daalo → `POST /v1/diy/verifyOtp` → `POST /v1/diy/user/login`
  5. Dashboard pe redirect ho
- **Expected:** Dashboard dikhe, `x-access-token` header set ho, token localStorage/cookie mein ho.
- **Validation:** ✅ network calls 200 ✅ token JWT format (eyJ...) ✅ redirect `/` pe

### TC-1.2 Invalid OTP
- **Steps:** galat OTP daalo
- **Expected:** Error message "Invalid OTP", login na ho, 4xx response.
- **Validation:** API `status:"error"` response, UI mein error toast.

### TC-1.3 Token refresh
- **Steps:**
  1. Login karo
  2. Access token expire karo (15 min baad ya manually)
  3. Koi API call karo
- **Expected:** Axios interceptor auto `POST /v1/diy/refreshToken` call kare, original request retry ho, user ko login page pe bheja jaye bina.
- **Validation:** Parallel 401s → sirf 1 refresh call (single-flight).

### TC-1.4 Route guard
- **Steps:** Bina login `/courses` URL direct kholo
- **Expected:** `/login` pe redirect ho.
- **Validation:** Protected routes empty state nahi dikhate.

---

## Module 2: Sidebar / Navigation (R3.3)

### TC-2.1 API-driven tabs render
- **Steps:** Login ke baad sidebar dekho
- **Expected:** `GET /v1/diy/configuration/tabs` ka response render ho — items order wise, subMenu expandable.
- **Validation:** ✅ order match (Dashboard first) ✅ subMenu click pe routes khulein ✅ inactive tabs hidden

### TC-2.2 Feature flag off
- **Steps:** Tabs API mein `addOnKey: isLandingPageEnabled` = false mock karo
- **Expected:** "Landing Pages" menu hidden ho.
- **Validation:** Feature flag system kaam kare.

---

## Module 3: Dashboard (R3.2)

### TC-3.1 Stats cards
- **Steps:** Dashboard kholo
- **Expected:** `/v1/diy/landingPage/dashboard` se counts aake cards mein dikhein (Landing Pages, Courses, Coupons, Campaigns).
- **Validation:** ✅ API 200 ✅ numbers rendered ✅ `{status:"success"}` shape handle ho

### TC-3.2 Analytics filter
- **Steps:** day dropdown mein 1/7/15/30 select karo
- **Expected:** `/v1/diy/analytcs/stats?day=X` call ho, cards update ho (Website sessions, Buy Now Clicks, Transactions, Revenue + lifetimeRevenue).
- **Validation:** Percent up/down badge (flag 0/1) direction sahi ho.

---

## Module 4: Landing Page Builder (R3.4) — CORE

### TC-4.1 Template gallery
- **Steps:** Landing Pages → "Create New Page"
- **Expected:** 3 template cards: **Webinar / Course / Form** (original jaise).
- **Validation:** Har card pe "Create X Page" button + use-case description.

### TC-4.2 Wizard — course select
- **Steps:** "Create Course Page" → course dropdown kholo
- **Expected:** `/v2/courses` se courses list aaye; select karke "Next" active ho.
- **Validation:** Bina course select "Next" disabled.

### TC-4.3 Editor — drag & drop reorder
- **Steps:** Editor mein section (jaise FEATURES) ko drag karke HERO ke upar le jao
- **Expected:** Section order badle, dnd-kit smooth drag ho (touch + mouse).
- **Validation:** ✅ Redux state mein sections array reorder ho ✅ undo (Ctrl+Z) original order wapas laye.

### TC-4.4 Section props edit
- **Steps:** HERO section pe click karke props panel mein headline badlo
- **Expected:** Canvas mein live update ho (debounced save ya manual Save button).
- **Validation:** Text/image/color sab props save ho kar `PUT /v1/diy/section/form` jaye.

### TC-4.5 Theme panel
- **Steps:** Theme mein primary color badlo, font badlo
- **Expected:** Poore page ka color/font update ho.
- **Validation:** theme_json save ho.

### TC-4.6 Live preview (Shadow DOM)
- **Steps:** Preview button click
- **Expected:** Iframe mein page isolated CSS ke saath dikhe — dashboard ke styles leak na hon.
- **Validation:** iframe ke andar `<div>` shadowRoot mein ho.

### TC-4.7 Publish + public URL
- **Steps:** Publish click karo
- **Expected:** Slug generate ho (`my-coaching-xyz`), `/lp-preview/<slug>` public URL kaam kare (bina login).
- **Validation:** ✅ status: published ✅ public URL anonymous browser mein khule

### TC-4.8 Lead capture
- **Steps:** Public page pe lead form bharo (name+phone) → submit
- **Expected:** Lead save ho, teacher ke People/Leads section mein dikhe.
- **Validation:** `POST /v1/diy/leads` 200, People list mein entry.

---

## Module 5: Courses & Content (R3.5)

### TC-5.1 Course CRUD
- **Steps:** Course create → edit → archive
- **Expected:** Title, price, currency, cover sab save ho; list update ho.
- **Validation:** API calls `status:"success"`.

### TC-5.2 Content add + reorder
- **Steps:** Course mein video content add karo, phir drag se reorder karo
- **Expected:** `/v2/course/content/add` + reorder API call ho, order persist ho reload ke baad bhi.
- **Validation:** Prepared statement injection-safe (manual test).

### TC-5.3 Video player
- **Steps:** Video content play karo
- **Expected:** hls.js player chalu ho, seek/pause kaam kare.
- **Validation:** Console mein koi fatal error na ho.

---

## Module 6: Payments (R3.6)

### TC-6.1 Order create + checkout
- **Steps:** Subscribe page pe "Pay" click
- **Expected:** `POST /v3/diy/pay` → Razorpay order id → checkout popup khule (test mode).
- **Validation:** Amount + coupon discount sahi calculate ho.

### TC-6.2 Success verify
- **Steps:** Test payment complete karo
- **Expected:** `POST /v3/diy/pay/rzp/success` → server HMAC verify → order paid → course access grant → success page.
- **Validation:** payments row signature_verified=1.

### TC-6.3 Webhook backup
- **Steps:** Client success call skip karke webhook fire karo (mock)
- **Expected:** `/v1/diy/webhook` signature verify karke order reconcile kare.
- **Validation:** Galat signature pe 401/400 reject.

---

## Module 7: Batches & People (R3.7), Module 8: Chat (R3.8), Module 9: Campaigns (R3.9)

### TC-7.1 Batch + students
- **Steps:** Batch create, students add, ek remove karo
- **Expected:** batch_students junction update, list live reflect ho.

### TC-8.1 Chat polling
- **Steps:** Teacher↔Student 2 tabs mein message bhejo
- **Expected:** 3s polling mein message dono taraf dikhe, unread badge update ho.

### TC-9.1 Campaign publish
- **Steps:** Campaign create (audience: course-1 students) → publish
- **Expected:** sent_count update, log entries Evidence mein capture.

---

## Module 10: Analytics (R3.10)

### TC-10.1 Charts render
- **Steps:** Analytics page kholo, range badlo
- **Expected:** Revenue/views/leads charts (Recharts) update hon, `/v3/analytics/overview` se data aaye.

---

## Non-functional (R4)

### TC-N.1 Performance
- **Validation:** Lighthouse public page LCP < 2.5s; initial bundle < 2MB.

### TC-N.2 Security
- **Validation:** ✅ SQL injection attempt sanitized error de ✅ XSS payload DOMPurify se escape ho ✅ CORS galat origin block ho ✅ login rate-limit (5/min) 429 de.

---

## Execution & Evidence plan
- Har test case ka result `Evidence\TC-X.Y.md` + screenshots/logs mein store hoga.
- **Finish step:** Saare test cases pass hone ke baad `Evidence\FINISH.md` (summary + verdict).
