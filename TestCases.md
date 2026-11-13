# ðŸ§ª TestCases â€” Apna Class Plus

> Generated from `RFP.md` (R1â€“R5). Har test case mein: scenario, steps, expected outcome, validation points.
> **Execution proof `Evidence\` folder mein store hoga.**

---

## Module 1: Auth (R3.1)

### TC-1.1 OTP Login â€” valid user
- **Scenario:** Registered teacher phone se login karta hai.
- **Steps:**
  1. `/login` page kholo
  2. Phone number daalo â†’ "Send OTP" click
  3. `POST /v1/diy/generateOtp` call ho (network mein verify)
  4. OTP daalo â†’ `POST /v1/diy/verifyOtp` â†’ `POST /v1/diy/user/login`
  5. Dashboard pe redirect ho
- **Expected:** Dashboard dikhe, `x-access-token` header set ho, token localStorage/cookie mein ho.
- **Validation:** âœ… network calls 200 âœ… token JWT format (eyJ...) âœ… redirect `/` pe

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
- **Validation:** Parallel 401s â†’ sirf 1 refresh call (single-flight).

### TC-1.4 Route guard
- **Steps:** Bina login `/courses` URL direct kholo
- **Expected:** `/login` pe redirect ho.
- **Validation:** Protected routes empty state nahi dikhate.

---

## Module 2: Sidebar / Navigation (R3.3)

### TC-2.1 API-driven tabs render
- **Steps:** Login ke baad sidebar dekho
- **Expected:** `GET /v1/diy/configuration/tabs` ka response render ho â€” items order wise, subMenu expandable.
- **Validation:** âœ… order match (Dashboard first) âœ… subMenu click pe routes khulein âœ… inactive tabs hidden

### TC-2.2 Feature flag off
- **Steps:** Tabs API mein `addOnKey: isLandingPageEnabled` = false mock karo
- **Expected:** "Landing Pages" menu hidden ho.
- **Validation:** Feature flag system kaam kare.

---

## Module 3: Dashboard (R3.2)

### TC-3.1 Stats cards
- **Steps:** Dashboard kholo
- **Expected:** `/v1/diy/landingPage/dashboard` se counts aake cards mein dikhein (Landing Pages, Courses, Coupons, Campaigns).
- **Validation:** âœ… API 200 âœ… numbers rendered âœ… `{status:"success"}` shape handle ho

### TC-3.2 Analytics filter
- **Steps:** day dropdown mein 1/7/15/30 select karo
- **Expected:** `/v1/diy/analytcs/stats?day=X` call ho, cards update ho (Website sessions, Buy Now Clicks, Transactions, Revenue + lifetimeRevenue).
- **Validation:** Percent up/down badge (flag 0/1) direction sahi ho.

---

## Module 4: Landing Page Builder (R3.4) â€” CORE

### TC-4.1 Template gallery
- **Steps:** Landing Pages â†’ "Create New Page"
- **Expected:** 3 template cards: **Webinar / Course / Form** (original jaise).
- **Validation:** Har card pe "Create X Page" button + use-case description.

### TC-4.2 Wizard â€” course select
- **Steps:** "Create Course Page" â†’ course dropdown kholo
- **Expected:** `/v2/courses` se courses list aaye; select karke "Next" active ho.
- **Validation:** Bina course select "Next" disabled.

### TC-4.3 Editor â€” drag & drop reorder
- **Steps:** Editor mein section (jaise FEATURES) ko drag karke HERO ke upar le jao
- **Expected:** Section order badle, dnd-kit smooth drag ho (touch + mouse).
- **Validation:** âœ… Redux state mein sections array reorder ho âœ… undo (Ctrl+Z) original order wapas laye.

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
- **Expected:** Iframe mein page isolated CSS ke saath dikhe â€” dashboard ke styles leak na hon.
- **Validation:** iframe ke andar `<div>` shadowRoot mein ho.

### TC-4.7 Publish + public URL
- **Steps:** Publish click karo
- **Expected:** Slug generate ho (`my-coaching-xyz`), `/lp-preview/<slug>` public URL kaam kare (bina login).
- **Validation:** âœ… status: published âœ… public URL anonymous browser mein khule

### TC-4.8 Lead capture
- **Steps:** Public page pe lead form bharo (name+phone) â†’ submit
- **Expected:** Lead save ho, teacher ke People/Leads section mein dikhe.
- **Validation:** `POST /v1/diy/leads` 200, People list mein entry.

---

## Module 5: Courses & Content (R3.5)

### TC-5.1 Course CRUD
- **Steps:** Course create â†’ edit â†’ archive
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
- **Expected:** `POST /v3/diy/pay` â†’ Razorpay order id â†’ checkout popup khule (test mode).
- **Validation:** Amount + coupon discount sahi calculate ho.

### TC-6.2 Success verify
- **Steps:** Test payment complete karo
- **Expected:** `POST /v3/diy/pay/rzp/success` â†’ server HMAC verify â†’ order paid â†’ course access grant â†’ success page.
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
- **Steps:** Teacherâ†”Student 2 tabs mein message bhejo
- **Expected:** 3s polling mein message dono taraf dikhe, unread badge update ho.

### TC-9.1 Campaign publish
- **Steps:** Campaign create (audience: course-1 students) â†’ publish
- **Expected:** sent_count update, log entries Evidence mein capture.

---

## Module 10: Analytics (R3.10)

### TC-10.1 Charts render
- **Steps:** Analytics page kholo, range badlo
- **Expected:** Revenue/views/leads charts (Recharts) update hon, `/v3/analytics/overview` se data aaye.

---

## Module 11: Test Portal (R3.11) â€” Content > Test Portal

### TC-11.1 Test create + questions
- **Steps:** Test Portal â†’ Create Test (title, duration) â†’ MCQ questions add (4 options + correct + marks)
- **Expected:** Test draft save ho, questions list mein dikhen, `/v3/tests` API se verify ho.

### TC-11.2 Publish guard
- **Steps:** Bina question wale test pe Publish dabao
- **Expected:** Error aaye â€” "Publish se pehle kam se kam 1 question add karo"; question add karne ke baad publish succeed.

### TC-11.3 Public test â€” answers hidden
- **Steps:** `/public/test/:id` kholo (bina login)
- **Expected:** Published test dikhe; `correct` field response mein **na ho** (security); draft test 404 de.

### TC-11.4 Test submit + auto-score
- **Steps:** Public test fill karo (1 sahi, 1 galat) â†’ submit
- **Expected:** Score = sahi questions ke marks ka sum; `test_attempts` mein record save; teacher Results tab mein attempt dikhe.

---

## Module 12: Free Material (R3.12) â€” Content > Free Material

### TC-12.1 Free material CRUD
- **Steps:** Free Material page â†’ Add (pdf/youtube) â†’ edit â†’ draft toggle â†’ delete
- **Expected:** `/v3/free-materials` CRUD saare kaam karein; status chip update ho.

### TC-12.2 Public free material page
- **Steps:** `/free/:teacherId` kholo (bina login)
- **Expected:** Teacher ke published materials dikhen; **draft items hidden** rahen; `Get` link se resource khule.

### TC-12.3 Landing page section (live fetch)
- **Steps:** Builder mein "Free Material" section add karo â†’ publish â†’ public `/lp-preview/:slug` kholo
- **Expected:** Section live `/lp/api/free-materials?slug=` se items fetch kare; `/lp/api/:slug` landing page API unaffected rahe.

---

## Module 13: Question Types + Grading (R3.13) â€” Phase 11

### TC-13.1 True/False question
- **Steps:** Editor mein True/False question add karo (correct = True ya False)
- **Expected:** Options auto-set ho (True/False), auto-scoring sahi chale.

### TC-13.2 Objective (short answer)
- **Steps:** Objective question add karo accepted answers "h2o, H2O" ke saath; student "H2O" submit kare, phir "h20"
- **Expected:** "H2O" sahi count ho (case-insensitive exact match); "h20" galat.

### TC-13.3 Subjective + teacher grading
- **Steps:** Subjective question add karo â†’ student text jawab de submit kare â†’ teacher "Results & Grading" tab mein marks de (4/5)
- **Expected:** Submit pe score auto parts ka ho + "grading pending" dikhe; grading ke baad final score = auto + manual; attempt `graded` ho jaye.

### TC-13.4 Public API answers hidden (sab types)
- **Steps:** `/public/test/:id` check karo â€” mcq/tf/objective/subjective sab types ke saath
- **Expected:** `correct`, `accepted_answers`, `explanation` response mein na ho.

---

## Module 14: Test Player Upgrade (R3.14) â€” Phase 11

### TC-14.1 Sections + question palette
- **Steps:** Test mein section banao, questions usme daalo, public test kholo
- **Expected:** Section tab dikhe, right side palette (1..N boxes) color-coded ho (answered=green, current=highlight, marked=amber border).

### TC-14.2 Per-question time + speed indicator
- **Steps:** Test de â€” har question pe ruko
- **Expected:** "You: 00:xx Â· Avg: 00:xx" chip update ho; result review mein speed indicator (Superfast/On Time/Slow) dikhe.

### TC-14.3 View Solution + Re-attempt mode
- **Steps:** Editor mein Re-attempt mode ON karke publish karo; player mein question pe "View Solution" dabao
- **Expected:** Explanation + answer dikhe; Re-attempt: ON chip player mein dikhe.

### TC-14.4 Summary screen + Mark for review
- **Steps:** Kuch questions answer karo, kuch ðŸš© mark karo â†’ "Summary / Submit" dabao
- **Expected:** Counts (answered/unanswered/marked) + mini palette + "Submit Anyway" option.

### TC-14.5 Calculator + Rate the Test
- **Steps:** Player mein calculator icon dabao; test submit karke stars do
- **Expected:** Calculator modal expressions evaluate kare; rating save ho (`rated` attempt mein), result pe stars dikhen.

---

## Module 15: Bilingual Questions (R3.15) â€” Phase 12

### TC-15.1 Bilingual question save
- **Steps:** Editor mein Hindi + English dono text wala question add karo
- **Expected:** Dono languages DB mein save ho.

### TC-15.2 Language dropdown (player)
- **Steps:** Published test player mein "View in English / à¤¹à¤¿à¤‚à¤¦à¥€" dropdown se switch karo
- **Expected:** English default; Hindi select karne pe question + options + explanation Hindi mein dikhe (agar available); warna English fallback.

### TC-15.3 Public API bilingual fields
- **Steps:** `/public/test/:id` check karo
- **Expected:** `_hi` fields (question_hi, option_*_hi, explanation_hi) bhi mile â€” answers ab bhi hidden.

---

## Module 16: Palette Colors + Bulk Import (R3.16) â€” Phase 12

### TC-16.1 Palette 4-status color coding
- **Steps:** Player mein kuch questions attempt karo, kuch ðŸš© mark karo
- **Expected:** ðŸŸ© Attempted Â· â¬œ Unattempted Â· ðŸŸ§ Marked for Review (solid orange) Â· ðŸŸª Answered+Marked (purple) + legend box.

### TC-16.2 Bulk import â€” MCQ
- **Steps:** Editor "Bulk Import" mein docx-format text paste karo (multiple_choice + correct/incorrect tags)
- **Expected:** Parse preview sahi (options + correct + marks + solution); import ke baad questions list mein dikhe.

### TC-16.3 Bulk import â€” true_false / integer / fill_ups
- **Steps:** mixed types wala text paste karo
- **Expected:** true_false â†’ correct a/b; integer â†’ objective (accepted answer); fill_ups â†’ objective (comma answers); solution â†’ explanation; marks map ho.

### TC-16.4 Bulk import â€” bilingual paste
- **Steps:** Hindi + English block wala question paste karo
- **Expected:** Devanagari text `question_hi` mein, English `question` mein auto-split.

---

## Non-functional (R4)

### TC-N.1 Performance
- **Validation:** Lighthouse public page LCP < 2.5s; initial bundle < 2MB.

### TC-N.2 Security
- **Validation:** âœ… SQL injection attempt sanitized error de âœ… XSS payload DOMPurify se escape ho âœ… CORS galat origin block ho âœ… login rate-limit (5/min) 429 de.

---

## Execution & Evidence plan
- Har test case ka result `Evidence\TC-X.Y.md` + screenshots/logs mein store hoga.
- **Finish step:** Saare test cases pass hone ke baad `Evidence\FINISH.md` (summary + verdict).

## Module 17 — Firebase Spark Live (Phase 13)

### TC-17.1 Signup + Dashboard (live)
- **Steps:** Open https://apna-class-plus.web.app -> Signup (email/password) -> Dashboard.
- **Expected:** Teacher account in Firebase Auth + users/{uid} doc; dashboard counts from Firestore.
- **Status:** PASS (browser automation).

### TC-17.2 Test create + Bulk Import (live)
- **Steps:** Test Portal -> Create Test -> Bulk Import -> paste docx text -> Parse Preview -> Import.
- **Expected:** Test doc + questions subcollection in Firestore; editor shows N questions.
- **Status:** PASS (3 questions imported).

### TC-17.3 Publish + Public Player + Submit (live)
- **Steps:** Publish -> open /test/{id} as student -> answer all -> submit.
- **Expected:** Client-side score; attempt doc written; result screen shows score/total + review.
- **Status:** PASS (5/5, 100%, all correct incl. bilingual MCQ + objective).

### TC-17.4 Bilingual player rendering (live)
- **Steps:** Take test with Hindi-only MCQ in English mode.
- **Expected:** Hindi options render via L() fallback.
- **Status:** PASS.

### TC-17.5 Palette legend (live)
- **Steps:** Player screen.
- **Expected:** 4-state legend (Attempted / Attempted+Marked / Marked / Not Attempted).
- **Status:** PASS.

## Module 18 — Roles + 7-Day Trial (Phase 13c)

### TC-18.1 Super-admin bootstrap
- **Steps:** First signup on a fresh project.
- **Expected:** User role = superadmin, plan = active, config/roles doc created with superAdminUid.
- **Status:** PASS (teacher@apnatest.in promoted via bootstrap).

### TC-18.2 Teacher signup trial
- **Steps:** Signup as new teacher.
- **Expected:** role = teacher, plan = trial, trialEnd = now + 7 days.
- **Status:** PASS (Trial Teacher shows 7d left).

### TC-18.3 Trial banner
- **Steps:** Login as trial teacher -> Dashboard.
- **Expected:** "Trial: 7 din baaki hain" banner shown; hidden for superadmin.
- **Status:** PASS.

### TC-18.4 Admin page access control
- **Steps:** Login as teacher -> /admin.
- **Expected:** "Admin access required." shown.
- **Status:** PASS.

### TC-18.5 Admin user list + extend
- **Steps:** Login as superadmin -> /admin.
- **Expected:** All users listed with role/plan/trial; +7 days extend works.
- **Status:** PASS (both users shown).

## Module 19 - Student Store (Phase 13d)

### TC-19.1 Public store loads
- **Steps:** Open `/store` (logged out).
- **Expected:** Branded hero + tabs Tests / Free Material.
- **Status:** PASS.

### TC-19.2 Published tests listed
- **Steps:** Store -> Tests tab.
- **Expected:** Published tests with title, description, duration, question count, FREE chip, Start Test button.
- **Status:** PASS (Live Firebase Test, 30 min, 3 questions).

### TC-19.3 Start Test navigation
- **Steps:** Click Start Test on a store card.
- **Expected:** Navigates to `/test/:id` with student start form.
- **Status:** PASS.

### TC-19.4 Free material listed
- **Steps:** Store -> Free Material tab.
- **Expected:** Published materials with type icon, title, FREE chip, Get link.
- **Status:** PASS (Class 10 Science Notes PDF).

### TC-19.5 Teacher store share link
- **Steps:** Dashboard -> My Student Store -> Copy Link / Open; Sidebar -> My Store.
- **Expected:** Store URL copied to clipboard (button shows "Copied!"); store opens in new tab.
- **Status:** PASS.

### TC-19.6 Free material CRUD (Firebase)
- **Steps:** Free Material page -> Add Material -> Save; toggle Published/Draft; edit/delete.
- **Expected:** Material saved to Firestore, listed in admin, reflected on public store.
- **Status:** PASS (composite-index error fixed by client-side sorting).

## Module 20 - Courses in Firestore + Store Courses Tab (Phase 13e)

### TC-20.1 Create course (Firebase)
- **Steps:** /courses -> Create New Course -> title + price + description -> Create.
- **Expected:** Course doc in Firestore (status active), listed on Courses page.
- **Status:** PASS (Class 10 Science Complete Course, INR 499).

### TC-20.2 Course content + folder
- **Steps:** Manage Content -> Add Content (video + URL); New Folder.
- **Expected:** Content and folder persisted; counts update.
- **Status:** PASS (1 item + folder "Chapter 1 - Chemical Reactions").

### TC-20.3 Owner-scoped queries
- **Steps:** Load Content Manager while logged in.
- **Expected:** content/folder list loads (ownerUid filter satisfies Firestore rules).
- **Status:** PASS (permission-denied fixed by adding ownerUid filter).

### TC-20.4 Store Courses tab
- **Steps:** Open /store.
- **Expected:** COURSES (n) tab first; cards show title, description, price, Enroll.
- **Status:** PASS (COURSES (1), ₹499).

### TC-20.5 Enroll lead capture
- **Steps:** Store -> Enroll -> name + phone -> Enroll.
- **Expected:** Success message; lead doc created with ownerUid, courseId, courseTitle, source=store.
- **Status:** PASS (Rahul Sharma / 9876543210).

### TC-20.6 Dashboard course count
- **Steps:** Dashboard -> Published Courses card.
- **Expected:** Count of active courses.
- **Status:** PASS (1).
