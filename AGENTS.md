# RULES — Apna Class Plus project

## Rule 1: Working folder (user-defined)
- **Sirf `C:\Users\user\Desktop\Project Ncert\Apna Class Plus\` folder use karna hai** is project ke saare files/code ke liye.
- Client code: `Apna Class Plus\client\`, Server code: `Apna Class Plus\server\`, Docs: root of `Apna Class Plus\`.
- Parent folder (`Project Ncert\`) ke existing files ("Apna Maths Coach" project) ko **kabhi touch/overwrite/edit nahi karna**.
- Naya code/docs yahin banega, kahin aur nahi.

## General project rules
- Reference product: https://classplusapp.com/diy/ (clone ban raha hai, sirf architecture/features seekhne ke liye — koi proprietary code/assets copy nahi)
- Plans: `PLAN.md` | Design: `BLUEPRINT.md` (live-session verified)
- Bada kaam se pehle user se confirm karna (jaise abhi hua: plan → blueprint → phir code)
- Comms: user Hinglish mein baat karta hai — replies Hinglish mein hi dena

## Rule 2: Development Workflow (user-defined) — STRICTLY FOLLOW
1. **Setup:** Root folder (`Apna Class Plus\`) mein saari project files **organized** rakhna.
2. **Requirement (`RFP.md`):** `Apna Class Plus\RFP.md` file mein **user khud apni requirements daalta hai** (file mein dedicated input space hai). Requirements bina diye **koi coding/feature kaam start NAHI karna**.
3. **Test Cases (`TestCases.md`):** RFP.md ki requirements padhkar `TestCases.md` **generate** karna — step-by-step test scenarios, test steps, expected outcomes, validation points detail mein.
4. **Finish & Evidence:** Saare test cases execute hone ke baad ek **Finish step** perform karna, phir **`Evidence\` folder** mein execution results, output logs aur verification proof store karna.

### Workflow order (fixed):
```
RFP.md (user fills) → TestCases.md (generate) → Build → Execute tests → Finish → Evidence/
```

### Project structure (fixed):
```
Apna Class Plus\
├── AGENTS.md       ← rules (ye file)
├── PLAN.md         ← roadmap
├── BLUEPRINT.md    ← architecture design
├── RFP.md          ← USER KI REQUIREMENTS (user bharega)
├── TestCases.md    ← requirements se generate hoga
├── Evidence\       ← test execution results, logs, proof
├── client\         ← React frontend
└── server\         ← Node backend
```

## User notes
- User ke paas Classplus DIY ka **real account access hai** (login karwa ke live app explore kar sakte hain).
