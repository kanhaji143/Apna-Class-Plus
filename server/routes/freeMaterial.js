'use strict';
/**
 * Free Material routes (Phase 10) — original Classplus CMS Content > Free Material pattern
 * Free content (PDFs/videos) jo PUBLIC hai — lead magnet ke liye.
 * Endpoints:
 *   POST   /v3/free-materials        (create)
 *   GET    /v3/free-materials        (owner list)
 *   PUT    /v3/free-materials/:id    (update)
 *   DELETE /v3/free-materials/:id    (delete)
 *   POST   /v3/free-materials/reorder
 *   GET    /lp/api/free-materials?slug=|teacher=   (PUBLIC — landing pages + /free/:id page)
 */
const express = require('express');
const { db } = require('../db/init');
const { auth } = require('./auth');

const router = express.Router();
const ok = (data, message = 'successful') => ({ status: 'success', data, message });
const fail = (message) => ({ status: 'error', data: null, message });

// ---------- POST /v3/free-materials ----------
router.post('/v3/free-materials', auth, (req, res) => {
  const { type, title, url, description, status } = req.body || {};
  if (!title) return res.status(400).json(fail('title required'));
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) AS m FROM free_materials WHERE owner_id=?').get(req.user.id).m;
  const r = db.prepare('INSERT INTO free_materials (owner_id, type, title, url, description, status, sort_order) VALUES (?,?,?,?,?,?,?)')
    .run(req.user.id, type || 'pdf', title, url || null, description || null, status || 'published', maxOrder + 1);
  return res.json(ok(db.prepare('SELECT * FROM free_materials WHERE id=?').get(r.lastInsertRowid), 'Free material added'));
});

// ---------- GET /v3/free-materials ----------
router.get('/v3/free-materials', auth, (req, res) => {
  const items = db.prepare('SELECT * FROM free_materials WHERE owner_id=? ORDER BY sort_order, id').all(req.user.id);
  return res.json(ok(items, 'Free materials fetched'));
});

// ---------- PUT /v3/free-materials/:id ----------
router.put('/v3/free-materials/:id', auth, (req, res) => {
  const row = db.prepare('SELECT id FROM free_materials WHERE id=? AND owner_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json(fail('Not found'));
  const { type, title, url, description, status } = req.body || {};
  db.prepare('UPDATE free_materials SET type=COALESCE(?,type), title=COALESCE(?,title), url=COALESCE(?,url), description=COALESCE(?,description), status=COALESCE(?,status) WHERE id=?')
    .run(type ?? null, title ?? null, url ?? null, description ?? null, status ?? null, req.params.id);
  return res.json(ok(db.prepare('SELECT * FROM free_materials WHERE id=?').get(req.params.id), 'Updated'));
});

// ---------- DELETE /v3/free-materials/:id ----------
router.delete('/v3/free-materials/:id', auth, (req, res) => {
  const row = db.prepare('SELECT id FROM free_materials WHERE id=? AND owner_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json(fail('Not found'));
  db.prepare('DELETE FROM free_materials WHERE id=?').run(req.params.id);
  return res.json(ok({ deleted: true }, 'Deleted'));
});

// ---------- POST /v3/free-materials/reorder ----------
router.post('/v3/free-materials/reorder', auth, (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  const stmt = db.prepare('UPDATE free_materials SET sort_order=? WHERE id=? AND owner_id=?');
  for (const it of items) stmt.run(it.order, it.id, req.user.id);
  return res.json(ok({ reordered: items.length }, 'Reordered'));
});

// ---------- GET /lp/api/free-materials (PUBLIC) ----------
// ?teacher=<userId>  ya  ?slug=<landingPageSlug> (page -> owner resolve)
router.get('/lp/api/free-materials', (req, res) => {
  const { slug, teacher } = req.query;
  let ownerId = teacher ? Number(teacher) : null;
  if (!ownerId && slug) {
    const page = db.prepare('SELECT owner_id FROM landing_pages WHERE slug=?').get(slug);
    if (!page) return res.status(404).json(fail('Page not found'));
    ownerId = page.owner_id;
  }
  if (!ownerId) return res.status(400).json(fail('slug or teacher required'));
  const teacherRow = db.prepare('SELECT name FROM users WHERE id=?').get(ownerId);
  const items = db.prepare("SELECT id, type, title, url, description FROM free_materials WHERE owner_id=? AND status='published' ORDER BY sort_order, id")
    .all(ownerId);
  return res.json(ok({ teacherName: teacherRow ? teacherRow.name : '', items }, 'Free materials fetched'));
});

module.exports = { router };
