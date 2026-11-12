'use strict';
/**
 * Landing Page Builder routes — original DIY pattern (live-verified):
 *   GET  /v1/diy/templatePages            → template gallery
 *   POST /v1/diy/landingPages             → create from template
 *   GET  /v1/diy/landingPages?offset&limit → list (pagination)
 *   GET  /v1/diy/landingPages/:id         → detail (sections+theme)
 *   PUT  /v1/diy/section/form             → save sections/theme (draft)
 *   POST /v1/diy/landingPages/:id/publish → publish + slug
 *   GET  /lp/api/:slug                    → PUBLIC page data (no auth)
 *   POST /v1/diy/leads                    → PUBLIC lead capture
 *   GET  /v1/diy/leads                    → leads list (auth)
 *   GET  /v2/courses                      → courses (wizard ke liye)
 */
const express = require('express');
const { db } = require('../db/init');
const { auth } = require('./auth');

const router = express.Router();
const ok = (data, message = 'successful') => ({ status: 'success', data, message });
const fail = (message) => ({ status: 'error', data: null, message });

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// ---------- GET /v1/diy/templatePages ----------
router.get('/v1/diy/templatePages', auth, (req, res) => {
  const rows = db.prepare('SELECT id, name, description FROM templates').all();
  return res.json(ok(rows.map((t) => ({
    id: t.id, name: t.name, description: t.description,
    ctaText: 'Create ' + t.name.replace(' Page', '') + ' Page',
  })), 'Templates fetched'));
});

// ---------- POST /v1/diy/landingPages (create from template) ----------
router.post('/v1/diy/landingPages', auth, (req, res) => {
  const { templateId, title, courseId } = req.body || {};
  const tpl = db.prepare('SELECT * FROM templates WHERE id=?').get(templateId);
  if (!tpl) return res.status(400).json(fail('Invalid templateId'));

  const theme = JSON.stringify({ colors: { primary: '#6C5CE7', bg: '#FFFFFF' }, font: 'Nunito Sans', radius: 12 });
  const r = db.prepare('INSERT INTO landing_pages (owner_id, template_id, title, sections, theme, type) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, templateId, title || tpl.name, tpl.sections, theme, tpl.name);

  const page = db.prepare('SELECT * FROM landing_pages WHERE id=?').get(r.lastInsertRowid);
  return res.json(ok({
    _id: page.id, title: page.title, status: 'draft', type: page.type,
    totalVisitors: 0, totalConversions: 0, createdAt: new Date().toLocaleDateString('en-GB'),
  }, 'Landing page created'));
});

// ---------- GET /v1/diy/landingPages (list + pagination) ----------
router.get('/v1/diy/landingPages', auth, (req, res) => {
  const offset = parseInt(req.query.offset, 10) || 0;
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const rows = db.prepare(
    "SELECT id, title, slug, type, status, created_at AS createdAt FROM landing_pages WHERE owner_id=? ORDER BY id DESC LIMIT ? OFFSET ?"
  ).all(req.user.id, limit, offset);
  const total = db.prepare('SELECT COUNT(*) AS c FROM landing_pages WHERE owner_id=?').get(req.user.id).c;

  return res.json(ok({
    data: rows.map((r) => ({
      _id: r.id, title: r.title, slug: r.slug, type: r.type, status: r.status,
      totalVisitors: 0, totalConversions: 0, createdAt: r.createdAt, isOwner: 1,
    })),
    total, noOfResults: rows.length, noOfPages: Math.ceil(total / limit),
  }, 'successful'));
});

// ---------- GET /v1/diy/landingPages/:id ----------
router.get('/v1/diy/landingPages/:id', auth, (req, res) => {
  const page = db.prepare('SELECT * FROM landing_pages WHERE id=? AND owner_id=?').get(req.params.id, req.user.id);
  if (!page) return res.status(404).json(fail('Page not found'));
  return res.json(ok({
    _id: page.id, title: page.title, slug: page.slug, status: page.status, type: page.type,
    sections: JSON.parse(page.sections || '[]'), theme: JSON.parse(page.theme || '{}'),
  }, 'Page fetched'));
});

// ---------- PUT /v1/diy/section/form (save sections + theme — original endpoint name) ----------
router.put('/v1/diy/section/form', auth, (req, res) => {
  const { pageId, sections, theme, title } = req.body || {};
  const page = db.prepare('SELECT id FROM landing_pages WHERE id=? AND owner_id=?').get(pageId, req.user.id);
  if (!page) return res.status(404).json(fail('Page not found'));

  db.prepare('UPDATE landing_pages SET sections=?, theme=?, title=? WHERE id=?')
    .run(JSON.stringify(sections || []), JSON.stringify(theme || {}), title || undefined, pageId);
  return res.json(ok({ saved: true }, 'Sections saved'));
});

// ---------- POST /v1/diy/landingPages/:id/publish ----------
router.post('/v1/diy/landingPages/:id/publish', auth, (req, res) => {
  const page = db.prepare('SELECT * FROM landing_pages WHERE id=? AND owner_id=?').get(req.params.id, req.user.id);
  if (!page) return res.status(404).json(fail('Page not found'));

  let slug = page.slug || slugify(page.title) || ('page-' + page.id);
  // slug unique rakho
  let candidate = slug, n = 1;
  while (db.prepare('SELECT id FROM landing_pages WHERE slug=? AND id != ?').get(candidate, page.id)) {
    candidate = slug + '-' + (++n);
  }
  db.prepare("UPDATE landing_pages SET slug=?, status='published', published_at=datetime('now') WHERE id=?").run(candidate, page.id);

  return res.json(ok({
    publicUrl: '/lp-preview/' + candidate, slug: candidate, status: 'published',
  }, 'Page published'));
});

// ---------- GET /lp/api/:slug (PUBLIC — no auth; student-facing page data) ----------
router.get('/lp/api/:slug', (req, res) => {
  const page = db.prepare("SELECT * FROM landing_pages WHERE slug=? AND status='published'").get(req.params.slug);
  if (!page) return res.status(404).json(fail('Page not found'));
  return res.json(ok({
    _id: page.id, title: page.title,
    sections: JSON.parse(page.sections || '[]'), theme: JSON.parse(page.theme || '{}'),
  }, 'Page fetched'));
});

// ---------- POST /v1/diy/leads (PUBLIC lead capture) ----------
router.post('/v1/diy/leads', (req, res) => {
  const { slug, name, phone, courseId } = req.body || {};
  if (!slug || !name || !/^\d{10}$/.test(phone || '')) return res.status(400).json(fail('name + valid 10-digit phone required'));
  const page = db.prepare('SELECT id FROM landing_pages WHERE slug=?').get(slug);
  if (!page) return res.status(404).json(fail('Page not found'));
  db.prepare('INSERT INTO leads (page_id, name, phone, course_id) VALUES (?,?,?,?)')
    .run(page.id, name, phone, courseId || null);
  return res.json(ok({ captured: true }, 'Lead captured'));
});

// ---------- GET /v1/diy/leads (teacher apne leads dekhe) ----------
router.get('/v1/diy/leads', auth, (req, res) => {
  const rows = db.prepare(
    `SELECT l.id, l.name, l.phone, l.course_id, l.created_at, p.title AS pageTitle
     FROM leads l JOIN landing_pages p ON p.id = l.page_id
     WHERE p.owner_id = ? ORDER BY l.id DESC LIMIT 100`
  ).all(req.user.id);
  return res.json(ok(rows, 'Leads fetched'));
});

// ---------- GET /v2/courses (wizard course dropdown — original endpoint) ----------
router.get('/v2/courses', auth, (req, res) => {
  const rows = db.prepare('SELECT id, title, price, currency, description, status FROM courses WHERE owner_id=? ORDER BY id DESC').all(req.user.id);
  return res.json(ok({ data: rows.map((c) => ({ ...c, price: c.price === 0 ? 'Free' : '₹' + c.price })), total: rows.length }, 'Courses fetched'));
});

module.exports = { router };
