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

## Module 11: Test Portal (R3.11) — Content > Test Portal

### TC-11.1 Test create + questions
- **Steps:** Test Portal → Create Test (title, duration) → MCQ questions add (4 options + correct + marks)
- **Expected:** Test draft save ho, questions list mein dikhen, `/v3/tests` API se verify ho.

### TC-11.2 Publish guard
- **Steps:** Bina question wale test pe Publish dabao
- **Expected:** Error aaye — "Publish se pehle kam se kam 1 question add karo"; question add karne ke baad publish succeed.

### TC-11.3 Public test — answers hidden
- **Steps:** `/public/test/:id` kholo (bina login)
- **Expected:** Published test dikhe; `correct` field response mein **na ho** (security); draft test 404 de.

### TC-11.4 Test submit + auto-score
- **Steps:** Public test fill karo (1 sahi, 1 galat) → submit
- **Expected:** Score = sahi questions ke marks ka sum; `test_attempts` mein record save; teacher Results tab mein attempt dikhe.

---

## Module 12: Free Material (R3.12) — Content > Free Material

### TC-12.1 Free material CRUD
- **Steps:** Free Material page → Add (pdf/youtube) → edit → draft toggle → delete
- **Expected:** `/v3/free-materials` CRUD saare kaam karein; status chip update ho.

### TC-12.2 Public free material page
- **Steps:** `/free/:teacherId` kholo (bina login)
- **Expected:** Teacher ke published materials dikhen; **draft items hidden** rahen; `Get` link se resource khule.

### TC-12.3 Landing page section (live fetch)
- **Steps:** Builder mein "Free Material" section add karo → publish → public `/lp-preview/:slug` kholo
- **Expected:** Section live `/lp/api/free-materials?slug=` se items fetch kare; `/lp/api/:slug` landing page API unaffected rahe.

---

## Module 13: Question Types + Grading (R3.13) — Phase 11

### TC-13.1 True/False question
- **Steps:** Editor mein True/False question add karo (correct = True ya False)
- **Expected:** Options auto-set ho (True/False), auto-scoring sahi chale.

### TC-13.2 Objective (short answer)
- **Steps:** Objective question add karo accepted answers "h2o, H2O" ke saath; student "H2O" submit kare, phir "h20"
- **Expected:** "H2O" sahi count ho (case-insensitive exact match); "h20" galat.

### TC-13.3 Subjective + teacher grading
- **Steps:** Subjective question add karo → student text jawab de submit kare → teacher "Results & Grading" tab mein marks de (4/5)
- **Expected:** Submit pe score auto parts ka ho + "grading pending" dikhe; grading ke baad final score = auto + manual; attempt `graded` ho jaye.

### TC-13.4 Public API answers hidden (sab types)
- **Steps:** `/public/test/:id` check karo — mcq/tf/objective/subjective sab types ke saath
- **Expected:** `correct`, `accepted_answers`, `explanation` response mein na ho.

---

## Module 14: Test Player Upgrade (R3.14) — Phase 11

### TC-14.1 Sections + question palette
- **Steps:** Test mein section banao, questions usme daalo, public test kholo
- **Expected:** Section tab dikhe, right side palette (1..N boxes) color-coded ho (answered=green, current=highlight, marked=amber border).

### TC-14.2 Per-question time + speed indicator
- **Steps:** Test de — har question pe ruko
- **Expected:** "You: 00:xx · Avg: 00:xx" chip update ho; result review mein speed indicator (Superfast/On Time/Slow) dikhe.

### TC-14.3 View Solution + Re-attempt mode
- **Steps:** Editor mein Re-attempt mode ON karke publish karo; player mein question pe "View Solution" dabao
- **Expected:** Explanation + answer dikhe; Re-attempt: ON chip player mein dikhe.

### TC-14.4 Summary screen + Mark for review
- **Steps:** Kuch questions answer karo, kuch 🚩 mark karo → "Summary / Submit" dabao
- **Expected:** Counts (answered/unanswered/marked) + mini palette + "Submit Anyway" option.

### TC-14.5 Calculator + Rate the Test
- **Steps:** Player mein calculator icon dabao; test submit karke stars do
- **Expected:** Calculator modal expressions evaluate kare; rating save ho (`rated` attempt mein), result pe stars dikhen.

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
