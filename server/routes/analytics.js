'use strict';
/**
 * Analytics routes (Phase 9)
 * Endpoints: /v3/analytics/overview, /v1/diy/events/track
 */
const express = require('express');
const { db } = require('../db/init');
const { auth } = require('./auth');

const router = express.Router();
const ok = (data, message = 'successful') => ({ status: 'success', data, message });
const fail = (message) => ({ status: 'error', data: null, message });

// ---------- POST /v1/diy/events/track (public — landing page views/leads) ----------
router.post('/v1/diy/events/track', (req, res) => {
  const { type, pageId, meta } = req.body || {};
  if (!type) return res.status(400).json(fail('type required'));
  db.prepare('INSERT INTO events (type, page_id, meta) VALUES (?,?,?)').run(type, pageId || null, meta ? JSON.stringify(meta) : null);
  return res.json(ok({ tracked: true }, 'Event tracked'));
});

// ---------- GET /v3/analytics/overview?range=7d|30d|90d ----------
router.get('/v3/analytics/overview', auth, (req, res) => {
  const range = req.query.range || '30d';
  const days = parseInt(range, 10) || 30;

  // Total counts
  const totalLeads = db.prepare('SELECT COUNT(*) AS c FROM leads l JOIN landing_pages p ON p.id=l.page_id WHERE p.owner_id=?').get(req.user.id).c;
  const totalPageViews = db.prepare("SELECT COUNT(*) AS c FROM events WHERE type='page_view'").get().c;
  const totalPages = db.prepare('SELECT COUNT(*) AS c FROM landing_pages WHERE owner_id=?').get(req.user.id).c;
  const totalCourses = db.prepare('SELECT COUNT(*) AS c FROM courses WHERE owner_id=?').get(req.user.id).c;
  const totalCampaigns = db.prepare('SELECT COUNT(*) AS c FROM campaigns WHERE owner_id=?').get(req.user.id).c;

  // Daily leads for chart (last N days)
  const dailyLeads = db.prepare(`
    SELECT date(l.created_at) AS day, COUNT(*) AS count
    FROM leads l JOIN landing_pages p ON p.id=l.page_id
    WHERE p.owner_id=? AND l.created_at >= date('now', '-' || ? || ' days')
    GROUP BY date(l.created_at) ORDER BY day
  `).all(req.user.id, days);

  // Daily page views for chart
  const dailyViews = db.prepare(`
    SELECT date(created_at) AS day, COUNT(*) AS count
    FROM events WHERE type='page_view' AND created_at >= date('now', '-' || ? || ' days')
    GROUP BY date(created_at) ORDER BY day
  `).all(days);

  // Top pages by leads
  const topPages = db.prepare(`
    SELECT p.title, p.slug, COUNT(l.id) AS leads
    FROM landing_pages p LEFT JOIN leads l ON l.page_id=p.id
    WHERE p.owner_id=? GROUP BY p.id ORDER BY leads DESC LIMIT 5
  `).all(req.user.id);

  // Revenue placeholder (no payments yet — Phase 5 skipped)
  const revenueData = dailyLeads.map((d) => ({ day: d.day, revenue: 0 }));

  return res.json(ok({
    range,
    summary: {
      totalLeads, totalPageViews, totalPages, totalCourses, totalCampaigns,
      conversionRate: totalPageViews > 0 ? ((totalLeads / totalPageViews) * 100).toFixed(1) + '%' : '0%',
    },
    charts: {
      dailyLeads: dailyLeads.map((d) => ({ day: d.day, value: d.count })),
      dailyViews: dailyViews.map((d) => ({ day: d.day, value: d.count })),
      revenue: revenueData,
    },
    topPages,
  }, 'Analytics overview fetched'));
});

module.exports = { router };