# Apna Class Plus — Training Manual

> Complete training guide for Admin, Teacher aur Student workflows.
> Live app: https://apna-class-plus.web.app | Firebase project: `apna-class-plus`

---

## 1. Introduction

**Apna Class Plus** ek all-in-one coaching/institute management platform hai — Classplus DIY ke architecture aur features ko follow karta hai. Ek teacher/apne institute ko digital banane ke liye:

- apna **public student store** (courses, tests, free material)
- **landing pages** (leads collect karne ke liye)
- **online tests** (multiple question types + comprehension)
- **batches & students** management
- **chat** (teacher ↔ student, bina student login)
- **campaigns** (audience-based messaging)
- **payments** (Razorpay checkout — Test Mode / real keys)
- **analytics** (leads, views, revenue, progress)

**Tech stack:** React 18 + TypeScript + Vite (client), Firebase Auth + Firestore (data), Firebase Hosting (Spark plan). Local mode ke liye Node/Express + SQLite bhi available hai.

---

## 2. Roles & Access

| Role | Kaun | Login | Kya kar sakta hai |
|---|---|---|---|
| **Superadmin** | Platform owner (pehla signup) | Email/password | Sab kuch + Admin page (users/trials) |
| **Admin** | Institute owner | Email/password | Sab kuch + Admin page |
| **Teacher** | Staff/teacher | Email/password | Apna dashboard, content, students, store, analytics (Admin page nahi) |
| **Student** | Student/parent | **Login nahi** | Public store, course learning link, chat link ke through |

**Important points:**

- Pehla signup **superadmin** ban jata hai (`config/roles.superAdminUid`), trial exempt.
- Baaki har teacher ko **7-day trial** milta hai (soft banner — lockout nahi, product decision).
- Student ke paas koi account nahi hota — teacher shareable links deta hai:
  - `/learn/<token>` — course learning (capability URL, token secret)
  - `/chat/<token>` — chat (capability URL)
- Link kisi ko bhi mile to wo us student ke roop mein access le sakta hai — isliye links private rakho.

### Login

1. https://apna-class-plus.web.app/login kholo
2. Email + password daalo → **Sign In**

**Demo credentials:**

| Role | Email | Password |
|---|---|---|
| Superadmin | `teacher@apnatest.in` | `secret123` |
| Trial teacher | `trial@apnatest.in` | `secret123` |

---

## 3. Dashboard (Teacher)

Login ke baad dashboard dikhta hai:

- **Sidebar tabs:** Dashboard · Landing Pages · Courses · Content (Test Portal, Free Material) · Batches · People · Chats · Campaigns · Analytics · Student Progress · Coupons · Orders
- **My Student Store card** — store link (`/store`) copy/open karo, students ko bhejo
- **Overview cards:** Landing Pages, Published Courses, Coupons, Campaigns
- **Analytics cards:** New Leads, Page Views, Students, Courses, Revenue (last 7/15/30 days)
- **🌱 Seed Demo Data** — ek click mein demo course, test, coupon, landing page, material aur lead (missing cheezein banati hai, duplicate nahi)

**Mobile:** sidebar hamburger menu ke andar hota hai (screen ≤768px).

---

## 4. Landing Pages

Public lead-generation pages — Classplus DIY ka core feature.

### 4.1 Create

1. Sidebar → **Landing Pages** → **Create New Page**
2. Template chuno:
   - **Blank Page** — khud sections banao
   - **Course Landing** (9 sections) — course promotion ke liye; course select karo to hero/pricing auto-fill
   - **Lead Magnet** (7 sections) — free material + FAQ se leads
   - **Test Series Landing** (7 sections) — exam/test promo
3. Editor mein:
   - **Section Library** (left) — click karke section add karo; drag (⠿) se reorder
   - **Canvas** (center) — sections ka live thumbnail
   - **Props / Theme** (right) — selected section ke text/options; colors, font, corner radius
4. **Preview** — iframe mein final page
5. **Save** (draft) → **Publish** → public URL milta hai: `/lp-preview/<slug>`

### 4.2 Sections

Hero, Banner Strip, Features, Video, Pricing, Testimonials, FAQ, Free Material, Footer — sab editable. Free Material section public page par published material ki live list dikhata hai.

### 4.3 Student kya dekhta hai

Public page par lead form hota hai (naam + phone). Submit → lead **People** page mein aa jata hai (owner ke saath). Page khulte hi **page-view analytics** track hota hai.

---

## 5. Courses & Content

### 5.1 Course banayein

1. Sidebar → **Courses** → **Create New Course**
2. Title, Price (INR), Description → Create

### 5.2 Content add karein

1. Course card → **Manage Content**
2. **Add Folder** (e.g., "Chapter 1") aur **Add Content** (video/pdf/audio/link) — title, URL, type, description
3. Drag se reorder, folder ke andar daalo

### 5.3 Student ko access dein

- Course card → **🔗 share icon** → **Generate Link** → student name optional → copy
- Student `/learn/<token>` pe course dekhta hai, **Mark done** se progress hota hai (teacher `Student Progress` page pe dekhta hai)
- Link **capability URL** hai — student login ki zaroorat nahi

### 5.4 Student experience

- Hero (teacher name, course title, price, "For <student>")
- Lessons folder-wise, type icons, **Open** button
- Progress bar + % + "X/Y done"
- Progress localStorage + Firestore dono mein sync (cross-device)

---

## 6. Batches

Students ko groups mein rakhna (offline/online batches).

1. Sidebar → **Batches** → **Create New Batch**
2. Course select, batch name, start/end date → Create
3. **Manage Students** → phone se add:
   - existing student ho to link ho jata hai
   - naya ho to auto-create ho jata hai (source: batch)
   - duplicate same batch mein block
4. Remove → student batch se hatta hai (contact People mein rehta hai)
5. Batch list mein live student count dikhta hai

---

## 7. People (Leads & Students)

Do tabs: **Leads** aur **Students**.

### 7.1 Leads

- Store ya landing page se aaye contacts (owner ke saath)
- **Convert** → student ban jata hai
- **Auto onboarding:** agar lead mein course hai to convert par **📚 learning link + 💬 chat link** dono milte hain (dialog auto-open)
- **Access link** icon — manually bhi learning link bana sakte ho
- Delete lead

### 7.2 Students

- Add Student (naam + phone)
- Access link (course ho to)
- Delete

### 7.3 Chat link

Student chat link `/chat/<token>` — student teacher se seedha baat karta hai, teacher ki taraf **Chats** page mein conversation aa jata hai.

---

## 8. Chats

- Left: **Recent** conversations + **Students** list
- Contact select → thread khulta hai; naya chat shuru karte hi **share link** milta hai (copy/open)
- Student replies 3-second polling se turant dikhte hain
- Unread badge (thread na khula ho to)
- Student side `/chat/<token>`: teacher ka naam, thread, reply box — bina login

---

## 9. Campaigns

Audience-based messaging (mock send — Spark plan mein real SMS/WhatsApp gateway nahi).

1. Sidebar → **Campaigns** → **Create Campaign**
2. Name, Channel (SMS/Email/WhatsApp), Audience:
   - All (Students + Leads)
   - Leads only
   - Students only
   - Course students (course select)
   - Batch students (batch select)
3. Message likho → Create → **Publish**
4. Publish par recipients resolve hote hain (phone se dedupe), `sentCount`, `publishedAt`, recipients snapshot save
5. Cards par status, sent count, audience label, published date dikhta hai

**Note:** Ye demo/mock send hai — real delivery gateway ke liye Blaze plan + Cloud Functions chahiye.

---

## 10. Test Portal

### 10.1 Test banayein

1. Sidebar → **Content → Test Portal** → **Create Test**
2. Title, description, duration, re-attempt mode (View Solution during test)

### 10.2 Questions

- **Add Question** — types:
  - **MCQ** (single correct)
  - **True / False**
  - **Objective** (short answer, accepted answers comma-separated)
  - **Subjective** (long answer — teacher grading)
  - **Comprehension** (passage + sub-questions) — passage container (marks 0), sub-questions "Passage (Comprehension)" select se attach
- Sections (optional grouping), drag reorder
- Bilingual: English + हिंदी tabs (Hindi fallback English)
- **Bulk Import** — docx format text paste karke parse/import

### 10.3 Publish & public test

- **Publish** → public link `/test/<id>` copy karo, students ko bhejo
- Public player: sections, question palette (4-state), per-question timer, calculator, marked-for-review, summary, submit
- Scoring: MCQ/TrueFalse/Objective automatic; Subjective teacher "Results & Grading" tab mein marks deta hai
- Comprehension: passage box sub-question ke saath; passage count/scoring mein nahi

---

## 11. Free Material

1. Sidebar → **Content → Free Material** → **Add Material**
2. Title, type (PDF/YouTube/Video), URL, description → Save
3. **Publish** karo — public store aur landing page (Free Material section) mein dikhega
4. Public free material page: `/free/<teacherId>`

---

## 12. Coupons

1. Sidebar → **Coupons** → **Create Coupon**
2. Code (e.g., `WELCOME20`), discount type (**Percent** / **Flat**), value, course (ya All courses), expiry (optional) → Create
3. List mein status, expiry, **Used count**; Enable/Disable, Delete
4. Student store enroll dialog mein **coupon code + Apply** → discounted price turanta dikhta hai (₹499 → ₹399 jaisa)
5. Coupon `active` hone par public-readable hota hai (store validation ke liye)

---

## 13. Orders & Payments

### 13.1 Student side (store)

1. Store → course card → **Enroll →**
2. Naam, phone, coupon (optional) → **Enroll**
3. Agar course paid hai → **order** banega aur **Checkout** dialog khulega
4. Checkout dialog:
   - **Real Razorpay Checkout.js** — jab `runConfig.RAZORPAY_KEY` mein real key ho
   - **Test Mode mock** — jab key placeholder (`rzp_test_XXXX...`) ho → Simulate Pay / Simulate Fail
5. Payment complete → order `paid` + paid lead (People mein) + enrolled

### 13.2 Teacher side

- Sidebar → **Orders**: Revenue (paid), Paid Orders, Pending + order cards (student, amount, discount, coupon, paymentId)
- Dashboard **Revenue** card + Analytics daily revenue chart

**Note:** Spark plan mein webhook/backend verification nahi — real keys ke saath teacher manually verify karega.

---

## 14. Analytics

- Sidebar → **Analytics** (`/analytics`)
- Summary: Total Leads, Page Views, Landing Pages, Courses, Campaigns, Conversion Rate
- Range: 7 / 30 / 90 din — daily series (zero-filled)
- Charts: Daily Leads, Daily Page Views, Revenue
- **Top Landing Pages** by leads
- Page views public landing page khulte hi track hote hain (`events` collection)
- Dashboard analytics cards: leads, views (range + % change), students, courses, revenue

---

## 15. Student Progress

- Sidebar → **Student Progress** (`/progress`)
- Summary: Shared Links, Average Completion, Completed (100%)
- Har link: course, student/general, `X/Y lessons`, progress bar, %, Open preview
- Data `courseLinks.progress` se — student ki learning page par "Mark done" se banta hai

---

## 16. Admin — Users & Trials

Sirf **admin/superadmin** ke paas:

- Sidebar → **Admin (Users & Trials)**
- Users table: naam, email, role, plan, trial days left, actions
- Role change, plan change, trial management
- Superadmin `config/roles.superAdminUid` se identify hota hai

---

## 17. Student Journey (end-to-end)

1. Teacher store link bhejta hai: `/store`
2. Student courses/tests/free material dekhta hai
3. Course par **Enroll** → naam/phone (+ coupon) → checkout (paid ho to)
4. Teacher **People → Convert** karta hai → **onboarding links** milte hain
5. Teacher links bhejta hai: 📚 `/learn/<token>` + 💬 `/chat/<token>`
6. Student course padhta hai, **Mark done** karta hai, progress teacher ko dikhta hai
7. Student chat link se teacher se baat karta hai
8. Teacher campaigns/tests se engagement badhata hai

---

## 18. Public URLs — Quick Reference

| Feature | URL pattern | Login |
|---|---|---|
| Login | `/login` | — |
| Public store | `/store` | Nahi |
| Course landing | `/lp-preview/<slug>` | Nahi |
| Public test | `/test/<id>` | Nahi |
| Free material | `/free/<teacherId>` | Nahi |
| Course learning | `/learn/<token>` | Nahi (capability link) |
| Student chat | `/chat/<token>` | Nahi (capability link) |
| Teacher dashboard | `/` | Haan |
| Admin | `/admin` | Haan (admin/superadmin) |

---

## 19. Troubleshooting & FAQ

| Problem | Solution |
|---|---|
| Page blank / old version dikha | Fresh tab + `?cb=<timestamp>` use karo (hosting cache) |
| Coupon apply nahi ho raha | Code exact (case-insensitive) daalo; expiry check karo; course match karo |
| Link kholte hi "valid nahi" | Link expire/regenerate ho gayi — teacher se naya link maango |
| Payment nahi ho raha | `runConfig.RAZORPAY_KEY` check karo; abhi Test Mode hai (simulated) |
| Student chat nahi mil raha | Teacher chat page se share link copy karo |
| Sidebar nahi dikh raha (mobile) | Hamburger icon kholkar dekho |
| Landing page mein sections nahi | Publish karo; template khali to Blank choose karo |

---

## 20. Do's & Don'ts

**Do:**
- Pehle **Seed Demo Data** se samjho, phir real data daalo
- Har student ke liye alag learning/chat link banao (personalized)
- Landing page publish karne se pehle **Preview** zaroor dekho
- Test publish se pehle 2-3 questions add karke scoring verify karo
- Coupon expiry set karo taaki offers time-bound rahen

**Don't:**
- Links public/social media pe paste mat karo (capability URLs hain)
- Trial expiry ko hard lockout mat samjho — soft banner hai
- Real payment keys kabhi public repo/chat mein daal mat
- Student ko login credentials ki zaroorat nahi — links hi kaam karti hain

---

## 21. Known Limitations (training mein batana zaroori)

| Limitation | Reason |
|---|---|
| Payments abhi Test Mode (simulated) | real Razorpay keys set nahi |
| Real SMS/WhatsApp/Email gateway nahi | Spark plan — campaigns mock send |
| Cloud Functions/webhook nahi | Spark plan — payments manually verify |
| Trial expiry soft banner | product decision (option C) |
| Bulk import mein comprehension nahi | docx parser limitation |
| Student login nahi | capability links use hoti hain |
| Chat realtime = 3s polling | no Cloud Functions/listeners |

---

*Manual version: 2026-11-13 | Apna Class Plus — Training & Audit pack*
