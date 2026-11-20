# Apna Class Plus — Complete Feature Checklist (Hinglish)

> Sabhi features ek jagah — "kaise check karein" + expected result + live URL.
> Live app: https://apna-class-plus.web.app | Credentials: teacher@apnatest.in / secret123 (superadmin), trial@apnatest.in / secret123 (trial teacher)

---

## 0. Tayyari (Demo/Test ke liye)

1. Browser (fresh tab) kholo → https://apna-class-plus.web.app/login
2. Email `teacher@apnatest.in` / Password `secret123` → **Sign In**
3. Dashboard load hoga — sidebar mein tabs dikhenge
4. **🌱 Seed Demo Data** button click karo (missing demo course/test/coupon/page/material/lead ban jayenge)
5. Student screen ke liye alag incognito/phone tab rakho (bina login)

---

## 1. Auth & Roles

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 1.1 | Login | /login → email+password | Dashboard khule |
| 1.2 | Superadmin badge | top-right "Demo Teacher Live · superadmin" | role dikhe |
| 1.3 | Trial teacher | trial@apnatest.in se login | "Trial: N din baaki" banner |
| 1.4 | Admin page (admin only) | Sidebar "Admin (Users & Trials)" | users table + role/plan actions |
| 1.5 | Protected route redirect | /people bina login | /login redirect |

---

## 2. Dashboard

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 2.1 | Overview cards | Dashboard | Landing Pages, Published Courses, Coupons, Campaigns |
| 2.2 | Analytics cards | Dashboard (Last 7 Days) | New Leads, Page Views, Students, Courses, Revenue |
| 2.3 | My Student Store card | Dashboard | store link + Copy Link + Open |
| 2.4 | Seed Demo Data | button click | "Seeded: ..." alert |
| 2.5 | Trial banner | trial account se login | soft warning (no lockout) |

---

## 3. Sidebar & Navigation (Mobile + Desktop)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 3.1 | Desktop sidebar | wide screen | permanent drawer, 12 tabs |
| 3.2 | Mobile drawer | F12 → device toolbar (≤768px) | hamburger icon; tap → drawer open |
| 3.3 | Submenu (Content) | Content tab | Test Portal · Free Material chips |
| 3.4 | Navigation | any tab | route changes, URL update |

---

## 4. Public Student Store (`/store`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 4.1 | Hero + tabs | /store | teacher name, Courses/Tests/Free Material tabs |
| 4.2 | Course card | Courses tab | title, price, description, "Enroll →" |
| 4.3 | Global search | search box | courses/tests/materials filter |
| 4.4 | Daily quiz | store | "⚡ आज का क्विज़" card with Start → |
| 4.5 | Faculty tab | store | faculty profiles |
| 4.6 | Blog & News tab | store | posts visible |
| 4.7 | Enroll dialog | Enroll → | naam + phone + coupon field + Apply |
| 4.8 | Coupon apply | code DIWALI20 → Apply | "20% off. Price: ₹499 → ₹399" |
| 4.9 | Invalid coupon | WRONGCODE → Apply | "Invalid coupon" |
| 4.10 | Enroll submit | Enroll | "Enrolled! 🎉" |
| 4.11 | Free material tab | Free Material tab | published PDFs/videos + Get |

---

## 5. Courses (`/courses`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 5.1 | Create course | Create New Course | title, price, description |
| 5.2 | List | /courses | cards with status (active/archived) |
| 5.3 | Manage content | Manage Content | folders + lessons, drag reorder |
| 5.4 | Add folder | Add Folder | folder created |
| 5.5 | Add content | Add Content | video/pdf/audio/link |
| 5.6 | Share access link | 🔗 icon → Generate Link | `/learn/<token>` link |
| 5.7 | Archive | delete icon | status archived (not in store) |

---

## 6. Batches (`/batches`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 6.1 | Create batch | Create New Batch | course + name + dates |
| 6.2 | List + count | /batches | "X students" |
| 6.3 | Manage students | Manage Students | phone se add (existing link / new create) |
| 6.4 | Duplicate guard | same phone twice | blocked |
| 6.5 | Remove student | delete icon → confirm | removed; count update |
| 6.6 | Date format | list | dd/mm/yyyy |

---

## 7. People (`/people`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 7.1 | Leads list | Leads tab | name, phone, source, date |
| 7.2 | Students list | Students tab | name, phone, source |
| 7.3 | Add student | Add Student → Save | new student |
| 7.4 | Convert lead | Convert (course wala lead) | student banta hai + **Onboarding dialog** (📚 learning + 💬 chat links) |
| 7.5 | Auto access link | convert ke baad | `/learn/<token>` + `/chat/<token>` |
| 7.6 | Search | search box | name/phone filter |
| 7.7 | Delete | delete icon | removed |
| 7.8 | Access link icon | 🔗 on enrolled contact | dialog with prefilled name |

---

## 8. Chats (`/chat`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 8.1 | Contacts list | /chat | students + leads (dedupe) |
| 8.2 | Start chat | contact click | thread khule, share link dikhe |
| 8.3 | Send message | type + send | bubble right, conversation list update |
| 8.4 | Share link | copy/open | `/chat/<token>` |
| 8.5 | Public chat | student link (no login) | teacher name header, thread, reply |
| 8.6 | Two-way | student reply → teacher | ~3-6s mein dikhe |
| 8.7 | Unread badge | student message while other contact open | chip "1" → clear on open |
| 8.8 | Persistence | reload | sab persist |

---

## 9. Campaigns (`/campaigns`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 9.1 | Empty state | /campaigns (new) | "Koi campaign nahi" |
| 9.2 | Create draft | Create Campaign | audience dropdowns (course/batch by name) |
| 9.3 | Publish | Publish → confirm | "N recipients ko bheja (mock)", status published |
| 9.4 | Audience types | All / Leads / Students / Course / Batch | correct recipient count (dedupe) |
| 9.5 | Delete | delete icon | removed |
| 9.6 | Dashboard count | Dashboard | real count |

---

## 10. Coupons (`/coupons`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 10.1 | Create | Create Coupon | code, type, value, course, expiry |
| 10.2 | List + used count | /coupons | Used Nx |
| 10.3 | Enable/Disable | Disable button | status disabled |
| 10.4 | Delete | delete | removed |
| 10.5 | Store apply | store enroll → code → Apply | "X% off. Price: ₹Y → ₹Z" |
| 10.6 | Invalid code | WRONGCODE | "Invalid coupon" |
| 10.7 | Dashboard count | Dashboard | real count |

---

## 11. Referrals (`/referrals`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 11.1 | Create | Create Referral | code, discount, referrer, reward |
| 11.2 | Reward display | card | "Reward: ₹X/use · Total ₹Y" |
| 11.3 | Store apply (unified) | enroll → referral code → Apply | discount applied |
| 11.4 | Toggle/delete | buttons | works |

---

## 12. Blog & News (`/blog`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 12.1 | Create post | New Post | title, type (blog/news/short), body, status |
| 12.2 | Publish | Publish | status published |
| 12.3 | Public store | /store → Blog & News tab | post visible |
| 12.4 | Delete | delete icon | removed |

---

## 13. Surveys (`/surveys`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 13.1 | Create survey | New Survey | title, question, options (comma), status |
| 13.2 | Public page | /survey/:id (no login) | question + radio options + name + submit |
| 13.3 | Submit | submit | "Dhanyavaad!" |
| 13.4 | View results | View Results | counts per option + total |
| 13.5 | Copy link | Copy Link | clipboard |

---

## 14. Faculty (`/faculty`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 14.1 | Add faculty | Add Faculty | name, subject, experience, bio |
| 14.2 | Public store | /store → Faculty tab | profile card |
| 14.3 | Delete | delete icon | removed |

---

## 15. Free Material (`/content/free-material`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 15.1 | Add material | Add Material | title, type, url, description, status, category |
| 15.2 | Toggle status | chip click | published/draft |
| 15.3 | Edit | Edit | form prefilled |
| 15.4 | Delete | delete | removed |
| 15.5 | Public store | /store → Free Material | published items + Get |
| 15.6 | Landing page | FREE_MATERIAL section | live published list |
| 15.7 | Category filter | store Free Material tab | chips (Sab + categories) |

---

## 16. Test Portal (`/content/test-portal`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 16.1 | Create test | Create Test | title, description, duration, re-attempt mode |
| 16.2 | Add question | Add Question | MCQ/TrueFalse/Objective/Subjective/Comprehension |
| 16.3 | Bilingual | Hindi tab + Copy English→Hindi | Hindi field fallback |
| 16.4 | Sections | Add Section | section chips |
| 16.5 | Bulk import | Bulk Import → paste → parse → import | N questions inserted |
| 16.6 | Comprehension | type Comprehension → passage + sub-question via Passage select | grouping + numbering |
| 16.7 | Delete question | delete icon | removed (passage ungroups children) |
| 16.8 | Publish | Publish | status published; public link |
| 16.9 | Copy public link | Copy Public Link | clipboard |
| 16.10 | Results tab | Results & Grading | attempts + subjective grading |
| 16.11 | Leaderboard | Results tab | Top 10 + scores |
| 16.12 | Rate test | student rates | stars saved |

---

## 17. Public Test (`/test/:id`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 17.1 | Start screen | /test/:id | title, duration, count, name/phone |
| 17.2 | Test taking | Start Test | question, palette (4 states), timer |
| 17.3 | Question types | MCQ/TF/Objective/Subjective | inputs work |
| 17.4 | Comprehension | passage box (Show/Hide) | context above sub-question |
| 17.5 | Mark for review | flag icon | yellow state |
| 17.6 | Re-attempt mode | ON → View Solution | solution during test |
| 17.7 | Calculator | 🧮 icon | on-screen calculator |
| 17.8 | Summary/Submit | button | unanswered warning + submit |
| 17.9 | Result | submit | score/total, %, counters, review |
| 17.10 | Rank | result | "आपका रैंक: #N" |
| 17.11 | Leaderboard | result | Top 10 list |
| 17.12 | View Solution | button | explanation + answer |
| 17.13 | Rate test | stars | saved |

---

## 18. Landing Pages (`/landing-pages/list`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 18.1 | List | /landing-pages/list | cards + status + date |
| 18.2 | Create | Create New Page | 4 templates with sections count |
| 18.3 | Course wizard | Create Course Page | course select → editor with customized hero/pricing |
| 18.4 | Editor | edit page | section library, canvas, props/theme, drag reorder |
| 18.5 | Add section | + section | added |
| 18.6 | Remove section | delete icon | removed |
| 18.7 | Preview | Preview | iframe modal |
| 18.8 | Save | Save | "✅ Saved (draft)" (title persisted) |
| 18.9 | Publish | Publish | toast + "Published at: /lp-preview/<slug>" |
| 18.10 | Public page | /lp-preview/<slug> | all sections + lead form |
| 18.11 | Lead capture | form submit | lead in People (owner) |
| 18.12 | Page view tracking | open public | analytics +1 |

---

## 19. Analytics (`/analytics`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 19.1 | Summary cards | /analytics | leads, views, pages, courses, campaigns, conversion |
| 19.2 | Range filter | 7/30/90 days | buckets + zero-filled |
| 19.3 | Daily charts | charts | leads + views |
| 19.4 | Top landing pages | list | page title + lead count |
| 19.5 | Dashboard cards | Dashboard | New Leads, Page Views, Students, Courses, Revenue (7d) |

---

## 20. Orders & Payments (`/orders`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 20.1 | Store checkout | store enroll paid course | order create + PaymentDialog |
| 20.2 | Mock checkout | Simulate Pay | order paid + lead |
| 20.3 | Orders page | /orders | Revenue, Paid, Pending, cards |
| 20.4 | Dashboard revenue | Dashboard | revenue card |

---

## 21. Student Progress (`/progress`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 21.1 | List | /progress | shared links + completion |
| 21.2 | Summary cards | header | links, avg %, completed |
| 21.3 | Open preview | Open button | student view |
| 21.4 | Empty state | no links | hint card |

---

## 22. Admin (`/admin`)

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 22.1 | Users table | /admin | name, email, role, plan, trial |
| 22.2 | Role change | select role | updated |
| 22.3 | Plan change | select plan | updated |
| 22.4 | Trial info | trial teacher | days left |

---

## 23. Mobile Responsive

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 23.1 | Hamburger drawer | ≤768px | sidebar hidden → hamburger → drawer |
| 23.2 | Compact AppBar | mobile | small logout, shrink chip |
| 23.3 | Dialogs | mobile | margin 8px, full width |
| 23.4 | Rows wrap | editor/manager/learn/player | no horizontal scroll |
| 23.5 | Phone inputs | store/people/batches | type="tel" |
| 23.6 | Desktop regression | desktop | permanent drawer, all pages OK |

---

## 24. Public / Student-Side URLs

| # | URL | Feature |
|---|---|---|
| 24.1 | `/store` | public store |
| 24.2 | `/store/:teacherId` | teacher store |
| 24.3 | `/lp-preview/<slug>` | landing page |
| 24.4 | `/test/:id` | public test |
| 24.5 | `/free/:teacherId` | free material |
| 24.6 | `/learn/<token>` | course viewer + progress + rating |
| 24.7 | `/chat/<token>` | student chat |
| 24.8 | `/survey/:id` | public survey |
| 24.9 | `/tools/bmi` | BMI calculator |

---

## 25. Seed Demo Data

| # | Feature | Kaise check karein | Expected |
|---|---|---|---|
| 25.1 | Seed button | Dashboard → 🌱 Seed Demo Data | "Seeded: ..." |
| 25.2 | Idempotent | dobara click | "pehle se mojood hai" |
| 25.3 | Creates | course, test, coupon, page, material, lead | verified |

---

## 26. Known Limitations (training mein batana)

- Payments Test Mode (real keys nahi)
- Real SMS/WhatsApp gateway nahi (mock send)
- Cloud Functions/webhook nahi (Spark)
- Trial soft banner (no hard lockout)
- Bulk import mein comprehension nahi
- Student login nahi (capability links)
- Chat realtime = 3s polling

---

*Complete Feature Checklist — version 2026-11-13 | Apna Class Plus*
