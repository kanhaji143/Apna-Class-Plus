# Apna Class Plus

Classplus DIY ka **architecture/features clone** — React 18 + TypeScript + Vite client, aur Firebase Spark (Auth + Firestore + Hosting) pe live.
Reference product: https://classplusapp.com/diy/ — sirf features/architecture seekhe gaye hain, koi proprietary code/assets copy nahi.

**Live URL:** https://apna-class-plus.web.app
**Firebase project:** `apna-class-plus` (Firestore `asia-south1`)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Client | React 18, TypeScript, Vite, MUI, Redux Toolkit, React Router, recharts |
| Data (live) | Firebase Auth (email/password) + Firestore |
| Data (local) | Node/Express + `node:sqlite` (original flow, `FIREBASE_MODE=false`) |
| Hosting | Firebase Hosting (Spark) |

**Key pattern:** `client/src/firebase/fbRouter.ts` — saare REST endpoint shapes ko Firestore pe map karta hai, taaki pages ka code unchanged rahe.
`window.runConfig.FIREBASE_MODE === true` hone par `api/client.ts` har call fbRouter pe route karta hai.

---

## Folder Structure

```
Apna Class Plus/
├── AGENTS.md            # project rules
├── PLAN.md BLUEPRINT.md # roadmap + architecture
├── RFP.md               # requirements (phases)
├── TestCases.md         # generated test cases (modules)
├── Evidence/            # execution results / verification proof
├── client/              # React frontend (Vite)
│   ├── src/firebase/    # fb.ts (init), fbRouter.ts (endpoint→Firestore)
│   ├── src/features/    # dashboard, builder, courses, batches, people, chat,
│   │                    # campaigns, analytics, progress, coupons, tests, store...
│   ├── src/api/client.ts# API helpers (FB_MODE routing)
│   └── firestore.rules  # security rules
└── server/              # local Express + node:sqlite (reference flow)
```

---

## Local Development

```powershell
# terminal 1 — API server (port 4000)
cd "Apna Class Plus\server"
npm install
npm start

# terminal 2 — Vite dev server (port 5173)
cd "Apna Class Plus\client"
npm install
npm run dev
```

Local mode mein `window.runConfig.FIREBASE_MODE` `false` hota hai — OTP login flow
(phone `9999999999`, `/v1/diy/generateOtp` response mein `devOtp` milta hai).

---

## Live Deploy (Firebase Spark)

Spark plan hai (no credit card) — Cloud Functions / Blaze features use nahi hote.

```powershell
cd "Apna Class Plus\client"
node node_modules\typescript\bin\tsc -b
node node_modules\vite\bin\vite.js build

# runtimeConfig overwrite (BOM-free UTF8 — PowerShell Set-Content BOM nahi chahiye)
$cfg = @'
// Firebase Spark live build
window.runConfig = {
  API_BASE_URL: '',
  FIREBASE_MODE: true,
  APP_ENVIRONMENT: 'production',
  RAZORPAY_KEY: 'rzp_test_XXXXXXXXXXXXXX',
};
'@
[System.IO.File]::WriteAllText("$PWD\dist\runtimeConfig.js", $cfg, (New-Object System.Text.UTF8Encoding($false)))

npx --yes firebase-tools deploy --only hosting,firestore:rules --project apna-class-plus
```

> Note: `Set-Content -Encoding UTF8` BOM add karta hai → rules deploy fail. Hamesha
> `[System.IO.File]::WriteAllText` + `UTF8Encoding($false)` use karo.

---

## Test Credentials (live)

| Role | Email | Password |
|---|---|---|
| Super admin | `teacher@apnatest.in` | `secret123` |
| Trial teacher | `trial@apnatest.in` | `secret123` |

Pehla signup `config/roles.superAdminUid` ban jata hai (superadmin, trial exempt).
Baaki teachers 7-day trial lete hain.

---

## Features (phases 1→13)

**Core:** auth (email/password), roles + 7-day trial (soft banner), dashboard, landing page builder (4 templates), courses + content/folders, batches + students, people (leads/students), chat, campaigns, analytics, test portal (4 question types + comprehension), free material, public store, admin.

**Phase 13 (Firebase Spark live):**
- Store (public) + courses tab + enroll → lead
- Roles/trial (`/admin`), student store links
- Batches on Firestore
- Analytics (real counts + page-view tracking)
- Campaigns (audience builder, mock send)
- Chat (teacher↔student, shareable public `/chat/:token`)
- Student course viewer (`/learn/:token`) + progress tracking
- Teacher progress dashboard (`/progress`)
- Comprehension (passage + sub-questions)
- Auto onboarding links on lead convert (learning + chat)
- Coupons (`/coupons` + store apply)
- Landing page templates with real sections

---

## Data Model Notes

- **Numeric IDs** — `counters/{name}` Firestore transaction se (pages unchanged).
- **Owner scoping** — queries mein `ownerUid` filter zaroori (Firestore rules inference).
- **No composite indexes** — filter-only queries, sorting client-side.
- **Capability links** — `/learn/:token`, `/chat/:token` random token = unguessable URL; student ko login nahi chahiye.
- **Coupons** — active coupons public-readable (store apply ke liye), owner-only write.
- **Progress** — `courseLinks.progress` map + localStorage sync.

---

## Known Limitations (documented)

| Limitation | Reason |
|---|---|
| Payments (Razorpay) skipped | test keys nahi hain |
| Cloud Functions / SMS gateway nahi | Spark plan (no Blaze) — campaigns "mock send" |
| Trial expiry soft banner only | product decision (option C) |
| Bulk import mein comprehension nahi | docx format parser limitation |
| Chat realtime = 3s polling | no Cloud Functions/listeners |
| Student login nahi | students contacts hain; capability links use hoti hain |

---

## Evidence

Har phase ke execution results, test outputs aur verification proof `Evidence/Phase-13-Execution.md`
aur `TestCases.md` mein hain.

## Training & Audit Pack

`Training/` folder mein complete training manual (PDF + Markdown) aur audit report hai:
- `Training-Manual.pdf` — admin/teacher/student workflows, step-by-step training guide
- `Audit-Report.pdf` — feature audit matrix, security review, issues, roadmap
- `Complete-Feature-Checklist.pdf` — sabhi 26 modules ka feature-by-feature "kaise check karein" checklist
- Sources (`.md`), print-ready HTML, aur `build-pdfs.mjs` (regenerate PDFs)

## Project History Book

`Book/` folder mein प्रोजेक्ट की संपूर्ण कार्य-सूची और चैट इतिहास की बुक है (देवनागरी हिंदी में):
- `Project-Chat-History.pdf` — हर task के अनुरोध, कार्य और परिणाम का क्रमबद्ध विवरण
- Source (`.md`) + print-ready HTML
