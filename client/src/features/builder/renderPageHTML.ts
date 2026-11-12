/** Sections + theme → complete HTML page (preview iframe + public render ke liye)
 *  Inline styles use karte hain taaki Shadow-DOM-jaisi CSS isolation mile (original DIY pattern). */
import type { BaseSection, Theme } from './types';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

function sectionHTML(s: BaseSection, t: Theme, slug: string): string {
  const p = s.props || {};
  const primary = t.colors.primary;
  const radius = t.radius;
  switch (s.type) {
    case 'HERO': {
      const bg = p.bgImage ? `background:url('${esc(p.bgImage)}') center/cover;` : `background:linear-gradient(135deg,${primary},#00CEC9);`;
      return `<section style="padding:80px 20px;text-align:center;color:#fff;${bg}">
        <h1 style="font-size:40px;margin:0 0 12px">${esc(p.headline)}</h1>
        <p style="font-size:18px;opacity:.95;margin:0 0 24px">${esc(p.subheadline)}</p>
        <a href="${esc(p.ctaLink || '#lead-form')}" style="display:inline-block;background:#fff;color:${primary};padding:14px 36px;border-radius:${radius}px;font-weight:800;text-decoration:none">${esc(p.ctaText)}</a>
      </section>`;
    }
    case 'BANNER_STRIP':
      return `<div style="background:${primary};color:#fff;overflow:hidden;padding:10px 0">
        <div style="display:inline-block;white-space:nowrap;font-weight:700;animation:marquee ${esc(p.speed)}s linear infinite">${esc(p.text)}</div>
      </div>
      <style>@keyframes marquee{from{transform:translateX(100vw)}to{transform:translateX(-100%)}}</style>`;
    case 'FEATURES':
      return `<section style="padding:48px 20px;background:${t.colors.bg}">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;max-width:1000px;margin:0 auto">
        ${(p.items || []).map((i: any) => `<div style="border:1px solid #eee;border-radius:${radius}px;padding:24px;text-align:center">
            <div style="font-size:36px">${esc(i.icon)}</div>
            <h3 style="margin:8px 0 4px">${esc(i.title)}</h3>
            <p style="margin:0;color:#666">${esc(i.desc)}</p>
          </div>`).join('')}
        </div></section>`;
    case 'TESTIMONIALS':
      return `<section style="padding:48px 20px;background:#F7F8FC">
        <h2 style="text-align:center">Student Results</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;max-width:1000px;margin:0 auto">
        ${(p.items || []).map((i: any) => `<blockquote style="background:#fff;border-radius:${radius}px;padding:20px;margin:0;border-left:4px solid ${primary}">
            <p style="margin:0 0 8px">❝ ${esc(i.quote)} ❞</p>
            <footer style="font-weight:700;color:${primary}">${esc(i.name)} · ${'★'.repeat(i.rating || 5)}</footer>
          </blockquote>`).join('')}
        </div></section>`;
    case 'PRICING':
      return `<section id="pricing" style="padding:48px 20px">
        <h2 style="text-align:center">Our Plans</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;max-width:1000px;margin:0 auto">
        ${(p.plans || []).map((pl: any) => `<div style="border:2px solid ${primary};border-radius:${radius}px;padding:24px;text-align:center">
            <h3 style="margin:0">${esc(pl.name)}</h3>
            <p style="margin:8px 0"><span style="text-decoration:line-through;color:#999">₹${esc(pl.strike)}</span>
            <b style="font-size:28px">₹${esc(pl.price)}</b></p>
            <ul style="list-style:none;padding:0;margin:12px 0;color:#555">${(pl.features || []).map((f: any) => `<li>✔ ${esc(f)}</li>`).join('')}</ul>
            <a href="#lead-form" style="display:block;background:${primary};color:#fff;padding:10px;border-radius:${radius}px;text-decoration:none;font-weight:800">${esc(pl.ctaText)}</a>
          </div>`).join('')}
        </div></section>`;
    case 'FAQ':
      return `<section style="padding:48px 20px;max-width:800px;margin:0 auto">
        <h2 style="text-align:center">FAQs</h2>
        ${(p.items || []).map((i: any) => `<details style="border:1px solid #eee;border-radius:${radius}px;padding:12px 16px;margin:8px 0">
            <summary style="font-weight:700">${esc(i.q)}</summary>
            <p style="color:#555;margin:8px 0 0">${esc(i.a)}</p>
          </details>`).join('')}
      </section>`;
    case 'VIDEO':
      return `<section style="padding:48px 20px;text-align:center">
        <h2>${esc(p.title)}</h2>
        <iframe src="${esc(p.url)}" style="width:100%;max-width:720px;aspect-ratio:16/9;border:0;border-radius:${radius}px" allowfullscreen title="${esc(p.title)}"></iframe>
      </section>`;
    case 'FREE_MATERIAL': {
      // Static fallback items render hote hain; public page pe live list fetch hoke replace ho jati hai
      const staticItems = (p.items || []).map((i: any) => `<div style="border:1px solid #eee;border-radius:${radius}px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:8px">
          <span style="font-weight:700">📄 ${esc(i.title)}</span>
          ${i.url ? `<a href="${esc(i.url)}" target="_blank" style="color:${primary};font-weight:800;text-decoration:none">Get</a>` : ''}
        </div>`).join('');
      return `<section id="free-material" style="padding:48px 20px;background:${t.colors.bg}">
        <h2 style="text-align:center;margin:0 0 20px">${esc(p.heading || 'Free Study Material')}</h2>
        <div id="fm-list" style="display:flex;flex-direction:column;gap:10px;max-width:640px;margin:0 auto">${staticItems}</div>
        <script>
          (function(){
            var wrap = document.getElementById('fm-list');
            fetch('/lp/api/free-materials?slug=${slug}').then(function(r){return r.json()}).then(function(j){
              if (j.status!=='success' || !j.data.items || !j.data.items.length) return;
              wrap.innerHTML = j.data.items.map(function(m){
                var icon = m.type==='pdf' ? '📄' : (m.type==='youtube' ? '▶️' : '🎬');
                return '<div style="border:1px solid #eee;border-radius:${radius}px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:8px">'
                  + '<span style="font-weight:700">' + icon + ' ' + m.title.replace(/[&<>"]/g,'') + '</span>'
                  + (m.url ? '<a href="' + m.url + '" target="_blank" style="color:${primary};font-weight:800;text-decoration:none">Get</a>' : '')
                  + '</div>';
              }).join('');
            }).catch(function(){});
          })();
        </script>
      </section>`;
    }
    case 'FOOTER':
      return `<footer style="background:#222;color:#aaa;padding:32px 20px;text-align:center">
        <p style="margin:0 0 8px">${esc(p.contact)}</p>
        <p style="margin:0">${(p.links || []).map((l: any) => `<a href="${esc(l.url)}" style="color:#fff;margin:0 8px">${esc(l.text)}</a>`).join('')}
        ${(p.social || []).map((l: any) => `· <a href="${esc(l.url)}" style="color:#fff;margin:0 8px">${esc(l.text)}</a>`).join('')}</p>
      </footer>`;
    default:
      return '';
  }
}

export function renderPageHTML(sections: BaseSection[], theme: Theme, slug: string, fbOpts?: { fbMode?: boolean; materials?: any[] }): string {
  const FB = !!fbOpts?.fbMode;
  const leadForm = `
  <section id="lead-form" style="padding:48px 20px;background:${theme.colors.primary};color:#fff">
    <div style="max-width:480px;margin:0 auto;text-align:center">
      <h2>Enroll / Enquiry</h2>
      <p style="opacity:.9">Apna number daalo — hum call karenge</p>
      <form onsubmit="submitLead(event)">
        <input id="lf-name" placeholder="Aapka naam" required style="width:100%;padding:12px;border-radius:${theme.radius}px;border:0;margin:4px 0;font-size:16px">
        <input id="lf-phone" placeholder="Phone (10 digit)" required pattern="\\d{10}" style="width:100%;padding:12px;border-radius:${theme.radius}px;border:0;margin:4px 0;font-size:16px">
        <button style="width:100%;padding:14px;border-radius:${theme.radius}px;border:0;background:#222;color:#fff;font-weight:800;font-size:16px">Submit</button>
        <p id="lf-msg" style="margin:8px 0 0"></p>
      </form>
    </div>
  </section>
  <script>
    async function submitLead(e){
      e.preventDefault();
      var msg = document.getElementById('lf-msg');
      try{
        ${FB
          ? `parent.postMessage({ type: 'apna-lead', slug: '${slug}', name: document.getElementById('lf-name').value, phone: document.getElementById('lf-phone').value }, '*');\n        msg.textContent = '✅ Thank you! Hum jaldi call karenge.';\n        e.target.reset();`
          : `var res = await fetch('/v1/diy/leads', {method:'POST',headers:{'Content-Type':'application/json'},
          body: JSON.stringify({slug:'${slug}', name:document.getElementById('lf-name').value, phone:document.getElementById('lf-phone').value})});
        var j = await res.json();
        msg.textContent = j.status==='success' ? '✅ Thank you! Hum jaldi call karenge.' : ('❌ ' + (j.message||'Error'));
        if(j.status==='success') e.target.reset();`}
      }catch(err){ msg.textContent = '❌ Network error'; }
    }
  </script>`;

  const sectionsHtml = sections.map((s) => {
    if (s.type === 'FREE_MATERIAL' && FB) {
      // Firestore mode: live fetch ki zaroorat nahi — published materials pehle se fetch hoke inline
      const p: any = s.props || {};
      const items = (fbOpts?.materials && fbOpts.materials.length ? fbOpts.materials : (p.items || []));
      const rows = items.map((i: any) => `<div style="border:1px solid #eee;border-radius:${theme.radius}px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:8px">
          <span style="font-weight:700">${i.type === 'pdf' ? '📄' : i.type === 'youtube' ? '▶️' : '🎬'} ${esc(i.title)}</span>
          ${i.url ? `<a href="${esc(i.url)}" target="_blank" style="color:${theme.colors.primary};font-weight:800;text-decoration:none">Get</a>` : ''}
        </div>`).join('');
      return `<section id="free-material" style="padding:48px 20px;background:${theme.colors.bg}">
        <h2 style="text-align:center;margin:0 0 20px">${esc(p.heading || 'Free Study Material')}</h2>
        <div style="display:flex;flex-direction:column;gap:10px;max-width:640px;margin:0 auto">${rows || '<p style="text-align:center;color:#888">Abhi koi material published nahi.</p>'}</div>
      </section>`;
    }
    return sectionHTML(s, theme, slug);
  }).join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Landing Page</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;900&family=Nunito+Sans:wght@400;700;900&display=swap" rel="stylesheet">
    </head><body style="margin:0;font-family:'${esc(theme.font)}',sans-serif;background:${theme.colors.bg}">
    ${sectionsHtml}
    ${leadForm}
    </body></html>`;
}
