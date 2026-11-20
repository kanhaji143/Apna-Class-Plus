/**
 * Training pack builder — Markdown → styled HTML → (Chrome headless) PDF.
 * Usage: node build-pdfs.mjs   (PDFs Chrome headless se alag command se banenge)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s) {
  let t = escapeHtml(s);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return t;
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  let listType = null;
  const closeList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) { closeList(); i++; continue; }

    if (trimmed === '---') { closeList(); out.push('<hr>'); i++; continue; }

    if (trimmed.startsWith('> ')) { closeList(); out.push(`<blockquote>${inline(trimmed.slice(2))}</blockquote>`); i++; continue; }

    const h = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      i++; continue;
    }

    if (trimmed.startsWith('|')) {
      closeList();
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      const header = rows[0] || [];
      const body = rows.slice(1);
      out.push(
        '<table><thead><tr>' + header.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        body.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table>',
      );
      continue;
    }

    const ul = trimmed.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
      out.push(`<li>${inline(ul[1])}</li>`);
      i++; continue;
    }

    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
      out.push(`<li>${inline(ol[1])}</li>`);
      i++; continue;
    }

    closeList();
    out.push(`<p>${inline(trimmed)}</p>`);
    i++;
  }
  closeList();
  return out.join('\n');
}

const template = (title, body) => `<!doctype html>
<html lang="hi">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
@page { size: A4; margin: 14mm 12mm; }
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', 'Nirmala UI', 'Noto Sans Devanagari', system-ui, sans-serif; color: #1c1c28; line-height: 1.55; margin: 0; font-size: 12px; }
h1 { font-size: 26px; color: #4a3fd6; border-bottom: 3px solid #6C5CE7; padding-bottom: 8px; margin: 0 0 16px; }
h2 { font-size: 18px; color: #4a3fd6; margin: 22px 0 8px; border-bottom: 1px solid #e3e1f5; padding-bottom: 4px; }
h3 { font-size: 14px; color: #33334d; margin: 14px 0 6px; }
h4 { font-size: 12.5px; color: #33334d; margin: 10px 0 4px; }
p { margin: 6px 0; }
table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
th, td { border: 1px solid #d8d5ee; padding: 6px 8px; text-align: left; vertical-align: top; }
th { background: #f1efff; color: #3b2fbf; font-weight: 700; }
tr:nth-child(even) td { background: #faf9ff; }
ul, ol { margin: 6px 0 6px 20px; padding: 0; }
li { margin: 3px 0; }
code { background: #f1efff; padding: 1px 4px; border-radius: 4px; font-family: Consolas, monospace; font-size: 11px; }
blockquote { border-left: 4px solid #6C5CE7; margin: 12px 0; padding: 8px 12px; background: #f7f6ff; color: #444; }
hr { border: 0; border-top: 1px solid #e3e1f5; margin: 18px 0; }
a { color: #4a3fd6; text-decoration: none; }
h2, h3, tr { page-break-after: avoid; }
</style>
</head>
<body>
${body}
</body>
</html>`;

const jobs = [
  { md: 'Training-Manual.md', title: 'Apna Class Plus — Training Manual' },
  { md: 'Audit-Report.md', title: 'Apna Class Plus — Complete Audit Report' },
  { md: 'Complete-Feature-Checklist.md', title: 'Apna Class Plus — Complete Feature Checklist' },
  { md: '../Book/Project-Chat-History.md', title: 'Apna Class Plus — Project Chat History Book' },
];

for (const job of jobs) {
  const md = fs.readFileSync(path.join(__dirname, job.md), 'utf8');
  const html = template(job.title, mdToHtml(md));
  const htmlPath = path.join(__dirname, job.md.replace(/\.md$/, '.html'));
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('HTML written:', htmlPath);
}
