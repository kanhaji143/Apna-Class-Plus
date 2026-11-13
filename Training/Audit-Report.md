# Apna Class Plus — Complete Audit Report

> Audit date: 2026-11-13 | Live URL: https://apna-class-plus.web.app | Project: `apna-class-plus` (Firebase Spark)
> Scope: live app end-to-end, code review (client/server), security rules, data model, test coverage.

---

# FINAL AUDIT — Live Execution (2026-11-13)

Ye section **audit ke din live execute** kiya gaya — fresh QA sweep, data snapshot aur security checks ke saath. Neeche wala detailed report static analysis + cumulative E2E evidence se hai.

## A. Fresh QA Sweep — 23 Pages

| Page | Result |
|---|---|
| / dashboard | PASS |
| /landing-pages/list | PASS |
| /landing-pages/create | PASS |
| /courses, /courses/1/content | PASS |
| /batches, /batches/1/students | PASS |
| /people | PASS |
| /chat | PASS |
| /campaigns | PASS |
| /analytics | PASS |
| /progress | PASS |
| /coupons | PASS |
| /orders | PASS |
| /content/test-portal, /content/test-portal/2 | PASS |
| /content/free-material | PASS |
| /admin | PASS |
| /store (public) | PASS |
| /lp-preview/lead-magnet-2 | PASS (iframe content verified) |
| /learn/<token> (public) | PASS |
| /chat/<token> (public) | PASS |
| /test/2 (public) | PASS |

**Result: 23/23 pages render, 0 console errors.**

## B. Live Data Snapshot

| Area | Count | Details |
|---|---|---|
| Users | 2 | superadmin + trial teacher |
| Courses | 1 | Class 10 Science Complete Course (active, ₹499) |
| Tests | 3 | sab published (Live Firebase Test, Comprehension Demo, Demo Sample) |
| Landing pages | 4 | sab published |
| Free materials | 1 | published |
| Coupons | 2 | DIWALI20 (used 1x), WELCOME20 (used 0x) — active |
| Orders | 2 | 1 paid (₹499), 1 pending → **Revenue ₹499** |
| Campaigns | 2 | published (Diwali Offer, Batch Launch) |
| Chats | 3 | Priya Verma, Amit Kumar, Onboard Student |
| Batches | 1 | Morning Batch A (1 student) |
| People | 7 leads, 5 students | |
| Course access links | 4 | 1 at 100%, 3 at 0% |
| Analytics (7d) | 7 leads, 10 page views, 70% conversion | |

## C. Security Checks (live, signed-out state)

| Check | Result |
|---|---|
| Protected route (`/people`) signed-out → `/login` redirect | PASS |
| Public `/store` signed-out | PASS |
| Public `/learn/<token>` signed-out | PASS |
| Public `/chat/<token>` signed-out | PASS |
| Public `/test/<id>` signed-out | PASS |
| Invalid learn token → friendly error | PASS |
| Invalid coupon → "Invalid coupon" | PASS |
| Mobile drawer (hamburger, ≤768px) | PASS (matchMedia emulation) |

## D. Observations

- **Session persistence:** audit ke dauran ek tab mein logout mila (staleness/token refresh) — re-login turant kaam karta hai. Recommendation: fresh browser par auth persistence test.
- **Order #1 pending** — pre-fix test order, demo data ke roop mein harmless.
- **Hosting cache:** deploy ke baad stale chunk serve ho sakta hai — fresh tab + `?cb=<ts>` best practice hai.

## E. Final Verdict

**Apna Class Plus live app 23/23 pages, 0 console errors ke saath pass hua.** Saare core flows (store → enroll → coupon → payment → lead → convert → onboarding links → learning + progress + chat) E2E verified. Payments Test Mode mein hain. Demo/training ke liye **production-ready**; real payments ke liye keys + server-side verification recommended.

---

## 1. Executive Summary

Apna Class Plus ek **feature-complete** coaching/institute platform hai jo Classplus DIY ke architecture ko follow karta hai. Firebase Spark plan pe live hai — Auth (email/password) + Firestore + Hosting. Client React 18 + TypeScript + Vite hai; local mode ke liye Node/Express + SQLite bhi maintain hai.

**Verdict:** Demo/training ke liye **production-ready**. Real payments ke liye Razorpay test/real keys aur (optional) webhook verification chahiye. Security rules owner-scoped hain; kuch public-read surfaces (landing pages, store, tests, capability links, active coupons) by design hain.

**Audit method:**
- Live E2E browser testing (har feature, real credentials)
- Firestore rules review
- Console error sweep (20 pages)
- Code review: `fbRouter.ts` endpoint→Firestore mapping, API client FB routing
- TestCases.md (Modules 1–36) + Evidence/Phase-13-Execution.md

---

## 2. Environment & Credentials

| Item | Value |
|---|---|
| Live URL | https://apna-class-plus.web.app |
| Firebase project | apna-class-plus |
| Firestore region | asia-south1 |
| Hosting plan | Spark (no Blaze) |
| Auth | Email/Password |
| Superadmin | teacher@apnatest.in / secret123 |
| Trial teacher | trial@apnatest.in / secret123 |
| Local dev | server :4000 + client :5173 (FIREBASE_MODE=false) |
| Deploy | tsc → vite build → runtimeConfig (BOM-free) → firebase-tools deploy |

---

## 3. Feature Audit Matrix

| # | Feature | Status | Evidence / Notes |
|---|---|---|---|
| 1 | Auth (email/password), roles | ✅ Working | superadmin/trial logins verified; role gates (Admin page) |
| 2 | 7-day trial + soft banner | ✅ Working | banner on dashboard; expiry logic present; no hard lockout |
| 3 | Dashboard (cards, store link, seed) | ✅ Working | counts real; Seed Demo Data verified |
| 4 | Sidebar tabs + mobile drawer | ✅ Working | 12 tabs; hamburger ≤768px; navigation verified |
| 5 | Landing Pages (4 templates) | ✅ Working | create/publish/public render/lead form verified |
| 6 | Landing editor (sections/theme/props) | ✅ Working | 9 section types; drag reorder; preview; save/publish |
| 7 | Landing analytics (page views) | ✅ Working | events tracked; analytics counts verified |
| 8 | Courses + content/folders | ✅ Working | create/content manager verified |
| 9 | Course access links (`/learn/:token`) | ✅ Working | personalized, capability URL, no login |
| 10 | Course progress tracking | ✅ Working | mark done; localStorage + Firestore; % verified |
| 11 | Teacher progress dashboard | ✅ Working | per-link completion verified |
| 12 | Batches + students | ✅ Working | create/add by phone/remove/count verified |
| 13 | People (leads/students) | ✅ Working | convert/add/delete/search verified |
| 14 | Onboarding links on convert | ✅ Working | learning + chat auto-generated; dialog verified |
| 15 | Chat (teacher ↔ student) | ✅ Working | share link; 3s polling; unread badge; persistence |
| 16 | Campaigns | ✅ Working | audience builder; publish (mock); usage |
| 17 | Tests (4 types + comprehension) | ✅ Working | MCQ/TF/objective/subjective/comprehension; scoring |
| 18 | Test portal (sections, bulk import) | ✅ Working | bulk import verified; comprehension grouping |
| 19 | Public test player | ✅ Working | palette, timer, calculator, summary, review |
| 20 | Free Material | ✅ Working | publish → store/landing/public page |
| 21 | Public Store | ✅ Working | courses/tests/material tabs; enroll |
| 22 | Coupons | ✅ Working | CRUD; store apply; usage count; dashboard count |
| 23 | Orders & Payments | ✅ Working (Test Mode) | order → checkout dialog → paid → lead; /orders page |
| 24 | Analytics (overview + dashboard) | ✅ Working | leads/views/revenue; ranges; top pages |
| 25 | Admin (users & trials) | ✅ Working | user table; role/plan/trial actions |
| 26 | Student experience (store→learn→chat) | ✅ Working | end-to-end verified |
| 27 | README | ✅ Done | setup/deploy/credentials/limitations |
| 28 | Training pack (this folder) | ✅ Done | manual + audit + PDFs |

---

## 4. Test Coverage Summary

`TestCases.md` mein **36 modules** hain (har phase ke requirements se generate). Key modules:

| Module | Coverage |
|---|---|
| 1–16 | Local app phases (scaffold → free material) |
| 17–21 | Firebase live: core, roles/trial, store, courses, people |
| 22 | Batches |
| 23 | Analytics |
| 24 | Campaigns |
| 25 | Chat |
| 26 | Course viewer |
| 27 | Landing templates |
| 28 | Progress tracking |
| 29 | Progress dashboard + sidebar |
| 30 | Comprehension |
| 31–32 | Auto access link + onboarding links |
| 33 | Coupons |
| 34 | Final QA / README / seed |
| 35 | Mobile responsive |
| 36 | Payments |

Har module mein steps, expected outcome aur PASS/FAIL status documented hai.

---

## 5. Issues Found & Fixed During Audit

| Issue | Severity | Fix |
|---|---|---|
| Landing Pages list crash (Firestore Timestamp render → React #31) | High | Route returns ISO string; page uses fmtDate |
| Builder publish/save broken (page GET missing `_id`; wrong route path) | High | `_id` returned; `/v1/diy/section/form` standalone route |
| Public landing route never matched (`seg[1]` vs `seg[0]`) | High | Path index fixed; rules-safe published filter |
| Lead owner missing for public landing leads | Medium | Slug se owner resolve |
| Sidebar empty in FB mode (tabs fallback `[]`) | Medium | `/v1/diy/configuration/tabs` returns full tab set |
| Order complete route path wrong (`seg[3]` vs `seg[4]`) | High | Path fixed; order now marks paid |
| `pubPost` generic typing (build fail) | Low | Generic pubPost |
| Batch student remove bypassed FB router | Medium | `del()` query-param route |
| Hosting cache serving stale chunks | Low | Deploy notes: fresh tab + `?cb=<ts>` |

---

## 6. Known Limitations & Risks

| Limitation | Impact | Mitigation |
|---|---|---|
| Payments Test Mode (no real keys) | Real charges nahi ho rahe | Keys set karo → real checkout |
| No webhook/backend verification | Payment verify manually | Blaze + Cloud Functions / manual check |
| Campaigns mock send | No real SMS/WhatsApp | Blaze + gateway integration |
| Trial soft banner (no lockout) | Teachers continue after expiry | Product decision (option C) |
| Bulk import lacks comprehension | Passage import manual | UI se add karo |
| Capability URLs (learn/chat) | Link holder = student identity | Links private rakho |
| Active coupons publicly readable | Codes enumerable | Demo trade-off; rotate codes |
| No student login | Identity via link token | Acceptable for demo |
| Chat polling (3s) | Not true realtime | Firestore listeners possible later |
| No composite Firestore indexes | Query constraints | Filter-only + client-side sort |

---

## 7. Security Audit

### 7.1 Rules summary (firestore.rules)

| Collection | Public | Owner |
|---|---|---|
| pages | published read | create/update/delete |
| leads | create | read/update/delete |
| tests | published read (+questions/sections/attempts) | owner write |
| freeMaterials | published read | owner write |
| students | — | owner read/write |
| batches / batchStudents | — | owner read/write |
| chats | get (capability token) | list/update/delete; limited public update |
| courseLinks | get (capability token) | list/create; progress-only public update |
| coupons | active read | owner create/update/delete |
| orders | create (public store) | owner read/update/delete |
| events | create (page view) | owner read/delete |
| campaigns | — | owner read/write |
| users | get (self/superadmin) | self write; superadmin update |

### 7.2 Findings

- **Owner scoping consistent** — saare queries `ownerUid` filter use karte hain (Firestore rules inference).
- **Capability URLs** (`/learn/:token`, `/chat/:token`) — random 24-char tokens, unguessable; but link holder full access to that student's thread/course. **Recommendation:** share privately; rotate on suspicion.
- **Active coupons public** — code enumeration possible; acceptable for discount codes.
- **Public test attempts** — anyone with test link can submit attempts (by design); no PII beyond name/phone entered by student.
- **Orders create public** — amount client-provided; **risk:** tampered amount. **Recommendation:** real payments mein server-side amount verification (Cloud Functions/Blaze) + webhook signature.
- **No PII encryption** — phone numbers Firestore mein plain hain (demo). Production mein consider encryption/compliance.

### 7.3 Recommendations

1. Real payments: server-side order creation + webhook verification (Blaze).
2. Rate limiting / abuse protection on public endpoints (attempts, leads).
3. Link rotation UI (revoke a learn/chat link).
4. Audit logs for admin actions.
5. Production: move secrets (API keys) out of client bundle.

---

## 8. Performance & Scale

- Firestore queries: filter-only (no composite indexes) + client-side sorting — demo scale ke liye theek; bade scale par composite indexes + pagination.
- Chat polling 3s — chhote teams ke liye fine.
- Images/assets: Google Fonts only; no heavy assets.
- Hosting: CDN-backed static build.
- No Cloud Functions — sab client-side; Spark cost zero.

---

## 9. Architecture Audit

| Component | Assessment |
|---|---|
| `api/client.ts` FB routing | Clean single switch (`FB_MODE`); pages unchanged |
| `fbRouter.ts` endpoint→Firestore | Well-mapped; numeric IDs via counters; transactions for IDs |
| Firestore data model | Collections normalized enough; denormalized counts (batches/campaigns) acceptable |
| Rules | Correct owner scoping; public surfaces intentional |
| Client state | Redux (auth/builder) + local state; adequate |
| Local server | Reference implementation; not used live |
| Testing | 36 test modules + evidence; manual E2E (no automated suite) |
| Docs | RFP, TestCases, Evidence, README, Training pack |

**Recommendation:** automated E2E (Playwright) for regression; CI deploy preview.

---

## 10. Roadmap / Recommendations

| Priority | Item |
|---|---|
| P0 | Real Razorpay keys + server-side verification (Blaze) |
| P0 | Payments webhook / order reconciliation |
| P1 | Real SMS/WhatsApp gateway (campaigns) |
| P1 | Link revocation + audit logs |
| P2 | Automated E2E suite |
| P2 | Composite indexes + pagination for scale |
| P2 | Student login (optional) / OTP |
| P3 | Offline support (PWA) |

---

## 11. Conclusion

Live app **stable aur feature-complete** hai training/demo ke liye. Payments Test Mode mein hain — real keys ke saath checkout enable hota hai. Security model owner-scoped hai; capability links aur public surfaces documented hain. Saare major flows E2E verify kiye gaye hain (0 console errors, 20-page sweep).

---

*Audit version: 2026-11-13 | Prepared from live testing + code review*
