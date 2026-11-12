'use strict';
/**
 * Campaigns routes (Phase 8)
 * Endpoints: /v1/diy/campaignList, /v1/diy/campaign (create), /v1/diy/campaign/publish, /v1/diy/campaign/:id
 */
const express = require('express');
const { db } = require('../db/init');
const { auth } = require('./auth');

const router = express.Router();
const ok = (data, message = 'successful') => ({ status: 'success', data, message });
const fail = (message) => ({ status: 'error', data: null, message });

// ---------- GET /v1/diy/campaignList ----------
router.get('/v1/diy/campaignList', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM campaigns WHERE owner_id=? ORDER BY id DESC').all(req.user.id);
  return res.json(ok(rows.map((c) => ({
    _id: c.id, name: c.name, channel: c.channel,
    audience: c.audience_json ? JSON.parse(c.audience_json) : null,
    message: c.message, status: c.status, sentCount: c.sent_count,
    createdAt: c.created_at, publishedAt: c.published_at,
  })), 'Campaigns fetched'));
});

// ---------- POST /v1/diy/campaign (create draft) ----------
router.post('/v1/diy/campaign', auth, (req, res) => {
  const { name, channel, audience, message } = req.body || {};
  if (!name) return res.status(400).json(fail('name required'));
  const r = db.prepare('INSERT INTO campaigns (owner_id, name, channel, audience_json, message, status) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, name, channel || 'SMS', audience ? JSON.stringify(audience) : null, message || '', 'draft');
  return res.json(ok({ _id: r.lastInsertRowid, name, status: 'draft' }, 'Campaign created'));
});

// ---------- GET /v1/diy/campaign/:id ----------
router.get('/v1/diy/campaign/:id', auth, (req, res) => {
  const c = db.prepare('SELECT * FROM campaigns WHERE id=? AND owner_id=?').get(req.params.id, req.user.id);
  if (!c) return res.status(404).json(fail('Campaign not found'));
  return res.json(ok({
    _id: c.id, name: c.name, channel: c.channel,
    audience: c.audience_json ? JSON.parse(c.audience_json) : null,
    message: c.message, status: c.status, sentCount: c.sent_count,
    createdAt: c.created_at, publishedAt: c.published_at,
  }, 'Campaign fetched'));
});

// ---------- PUT /v1/diy/campaign/:id ----------
router.put('/v1/diy/campaign/:id', auth, (req, res) => {
  const { name, channel, audience, message } = req.body || {};
  const c = db.prepare('SELECT id FROM campaigns WHERE id=? AND owner_id=?').get(req.params.id, req.user.id);
  if (!c) return res.status(404).json(fail('Campaign not found'));
  db.prepare('UPDATE campaigns SET name=COALESCE(?,name), channel=COALESCE(?,channel), audience_json=COALESCE(?,audience_json), message=COALESCE(?,message) WHERE id=?')
    .run(name, channel, audience ? JSON.stringify(audience) : null, message, req.params.id);
  return res.json(ok({ updated: true }, 'Campaign updated'));
});

// ---------- POST /v1/diy/campaign/publish ----------
router.post('/v1/diy/campaign/publish', auth, (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json(fail('id required'));
  const c = db.prepare('SELECT * FROM campaigns WHERE id=? AND owner_id=?').get(id, req.user.id);
  if (!c) return res.status(404).json(fail('Campaign not found'));

  // Resolve audience → recipient count (mock send)
  let count = 0;
  const audience = c.audience_json ? JSON.parse(c.audience_json) : { type: 'all' };
  if (audience.type === 'all') {
    count = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role='student'").get().c + db.prepare('SELECT COUNT(*) AS c FROM leads l JOIN landing_pages p ON p.id=l.page_id WHERE p.owner_id=?').get(req.user.id).c;
  } else if (audience.type === 'course') {
    count = db.prepare('SELECT COUNT(*) AS c FROM batch_students bs JOIN batches b ON b.id=bs.batch_id WHERE b.course_id=?').get(audience.id).c;
  } else if (audience.type === 'batch') {
    count = db.prepare('SELECT COUNT(*) AS c FROM batch_students WHERE batch_id=?').get(audience.id).c;
  } else if (audience.type === 'leads') {
    count = db.prepare('SELECT COUNT(*) AS c FROM leads l JOIN landing_pages p ON p.id=l.page_id WHERE p.owner_id=?').get(req.user.id).c;
  }

  // Mock: mark as published, set sent_count
  db.prepare("UPDATE campaigns SET status='published', sent_count=?, published_at=datetime('now') WHERE id=?").run(count, id);

  // Log entries (mock — real SMS/Email/WhatsApp gateway Phase 8.5)
  console.log(`[campaign] "${c.name}" published via ${c.channel} → ${count} recipients (mock send)`);

  return res.json(ok({ sentCount: count }, 'Campaign published'));
});

// ---------- DELETE /v1/diy/campaign/:id ----------
router.delete('/v1/diy/campaign/:id', auth, (req, res) => {
  db.prepare('DELETE FROM campaigns WHERE id=? AND owner_id=?').run(req.params.id, req.user.id);
  return res.json(ok({ deleted: true }, 'Campaign deleted'));
});

module.exports = { router };