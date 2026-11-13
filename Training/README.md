# Training & Audit Pack

Is folder mein **Apna Class Plus** project ki training material aur audit report hai.

## Files

| File | Use |
|---|---|
| `Training-Manual.pdf` | Complete training guide — admin/teacher/student workflows, step-by-step |
| `Training-Manual.md` | Manual ka source text (edit karke dobara PDF bana sakte ho) |
| `Training-Manual.html` | Print-ready HTML (PDF source) |
| `Audit-Report.pdf` | Complete audit — feature matrix, security, issues, roadmap |
| `Audit-Report.md` | Audit ka source text |
| `Audit-Report.html` | Print-ready HTML |
| `build-pdfs.mjs` | MD → HTML converter script |

## PDF dobara kaise banayein

```powershell
cd "Apna Class Plus\Training"
node build-pdfs.mjs

# Chrome headless se PDF
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$dir = "$PWD"
$html = "file:///$($dir.Replace('\','/').Replace(' ','%20'))/Training-Manual.html"
& $chrome --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$dir\Training-Manual.pdf" $html
```

> Note: Agar Chrome path alag hai to `--print-to-pdf` ke liye koi bhi Chromium browser chalega.

## Kya cover hai

**Training Manual:** roles (superadmin/admin/teacher/student), login, dashboard, landing pages, courses + content, batches, people, chat, campaigns, tests + comprehension, free material, coupons, payments, analytics, progress, admin, student journey, URLs, troubleshooting, limitations.

**Audit Report:** 28-feature audit matrix, test coverage (36 modules), issues found & fixed, known limitations/risks, security audit (rules + findings + recommendations), performance/scale, architecture audit, roadmap.
