'use strict';
/**
 * Auth routes — original DIY flow (live-verified):
 *   POST /v1/diy/generateOtp → POST /v1/diy/verifyOtp → POST /v1/diy/user/login
 * + GET /v1/diy/orgDetails, /v1/diy/userDetails, /v1/diy/configuration/tabs
 * Response shape (original): { status, data, message }
 */
const express = require('express');
const crypto = require('crypto');
const { db } = require('../db/init');
const { signAccess, signRefresh, verify } = require('../lib/jwt');

const router = express.Router();
const ok = (data, message = 'successful') => ({ status: 'success', data, message });
const fail = (message, code = 400) => ({ status: 'error', data: null, message });

// simple in-memory rate limit (production: proper limiter)
const otpHits = new Map();
function rateLimit(phone, max = 5) {
  const now = Date.now();
  const arr = (otpHits.get(phone) || []).filter(t => now - t < 60_000);
  arr.push(now);
  otpHits.set(phone, arr);
  return arr.length <= max;
}

// ---------- POST /v1/diy/generateOtp ----------
router.post('/v1/diy/generateOtp', (req, res) => {
  const { phone } = req.body || {};
  if (!phone || !/^\d{10}$/.test(phone)) return res.status(400).json(fail('Valid 10-digit phone required'));

  if (!rateLimit(phone)) return res.status(429).json(fail('Too many OTP requests, try after a minute'));

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 5 * 60_000).toISOString();
  db.prepare('INSERT INTO otps (phone, otp, expires_at) VALUES (?,?,?)').run(phone, otp, expires);

  // Dev only — real app SMS bhejta hai. SMS gateway Phase 7 mein.
  console.log(`[dev-otp] ${phone} => ${otp}`);
  return res.json(ok({ phone, devOtp: otp }, 'OTP generated'));
});

// ---------- POST /v1/diy/verifyOtp ----------
router.post('/v1/diy/verifyOtp', (req, res) => {
  const { phone, otp } = req.body || {};
  if (!phone || !otp) return res.status(400).json(fail('phone and otp required'));

  const row = db.prepare(
    "SELECT * FROM otps WHERE phone=? AND otp=? AND used=0 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1"
  ).get(phone, otp);

  if (!row) return res.status(400).json(fail('Invalid or expired OTP'));
  db.prepare('UPDATE otps SET used=1 WHERE id=?').run(row.id);

  return res.json(ok({ phone, verified: true }, 'OTP verified'));
});

// ---------- POST /v1/diy/user/login ----------
router.post('/v1/diy/user/login', (req, res) => {
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json(fail('phone required'));

  let user = db.prepare('SELECT * FROM users WHERE phone=?').get(phone);
  if (!user) {
    // self-signup (original DIY bhi naye phone pe onboarding deta hai)
    const r = db.prepare('INSERT INTO users (name, phone, role) VALUES (?,?,?)').run('New Teacher', phone, 'teacher');
    user = db.prepare('SELECT * FROM users WHERE id=?').get(r.lastInsertRowid);
  }

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)')
    .run(refreshToken, user.id, new Date(Date.now() + 7 * 864e5).toISOString());

  return res.json(ok({
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    accessToken, refreshToken,
  }, 'Login successful'));
});

// ---------- POST /v1/diy/refreshToken ----------
router.post('/v1/diy/refreshToken', (req, res) => {
  const token = req.body && req.body.refreshToken;
  if (!token) return res.status(401).json(fail('refreshToken required'));
  try {
    const payload = verify(token);
    if (payload.type !== 'refresh') throw new Error('wrong type');
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(payload.id);
    if (!user) throw new Error('no user');
    return res.json(ok({ accessToken: signAccess(user) }, 'Token refreshed'));
  } catch {
    return res.status(401).json(fail('Invalid refresh token'));
  }
});

// ---------- auth middleware (x-access-token — original pattern) ----------
function auth(req, res, next) {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).json(fail('Missing x-access-token', 401));
  try {
    const payload = verify(token);
    if (payload.type !== 'access') throw new Error('wrong type');
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json(fail('Invalid or expired token', 401));
  }
}

// ---------- GET /v1/diy/orgDetails ----------
router.get('/v1/diy/orgDetails', auth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  return res.json(ok({
    name: user.name + "'s Academy",
    logo: null,
    env: 'development',
  }, 'Org details fetched'));
});

// ---------- GET /v1/diy/userDetails ----------
router.get('/v1/diy/userDetails', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, phone, role FROM users WHERE id=?').get(req.user.id);
  return res.json(ok(user, 'User details fetched'));
});

// ---------- GET /v1/diy/configuration/tabs (API-driven sidebar — original pattern) ----------
router.get('/v1/diy/configuration/tabs', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM tab_config ORDER BY sort_order').all();
  const flags = JSON.parse((db.prepare("SELECT value FROM settings WHERE key='featureFlags'").get() || { value: '{}' }).value);

  const data = rows
    .filter(r => r.is_active)
    .filter(r => !r.add_on_key || flags[r.add_on_key])   // feature-flag gating (original: addOnKey)
    .map(r => ({
      icon: `/icons/${r.icon}-inactive.svg`,
      activeIcon: `/icons/${r.icon}-active.svg`,
      title: r.title,
      slug: r.slug,
      isActive: true,
      order: r.sort_order,
      subMenu: r.sub_menu ? JSON.parse(r.sub_menu) : undefined,
      isAddOnEnabled: r.add_on_key ? 1 : 0,
      addOnKey: r.add_on_key || undefined,
    }));

  return res.json(ok(data, 'Tabs fetched'));
});

// ---------- GET /v1/diy/landingPage/dashboard (original: dashboard stats) ----------
router.get('/v1/diy/landingPage/dashboard', auth, (req, res) => {
  // Phase 1: placeholder counts (landing_pages/coupons/campaigns tables Phase 3/5/7 mein)
  const count = (sql) => { try { return db.prepare(sql).get().c; } catch { return 0; } };
  return res.json(ok({
    landingPageCount: count('SELECT COUNT(*) AS c FROM landing_pages'),
    publishedCourseCount: count('SELECT COUNT(*) AS c FROM courses'),
    bannerCount: 0,
    couponCount: count('SELECT COUNT(*) AS c FROM coupons'),
    campaignCount: count('SELECT COUNT(*) AS c FROM campaigns'),
    smsBalanaceStatus: null,
    tutorTestCount: 0,
    liveClassData: [],
  }, 'Diy Dashboard stats fetched successfully'));
});

// ---------- GET /v1/diy/analytcs/stats?day=X (original spelling: analytcs) ----------
router.get('/v1/diy/analytcs/stats', auth, (req, res) => {
  const day = parseInt(req.query.day, 10) || 7;
  // Phase 2: placeholder values — real analytics Phase 8 mein (events table)
  const data = [
    { id: 1, points: 9, text: 'Website sessions', percent: '55%', flag: 0, subtext: '55% down compared to last ' + day + ' days' },
    { id: 2, points: 0, text: 'Buy Now Clicks', percent: '0%', flag: 1, subtext: '0% up compared to last ' + day + ' days' },
    { id: 3, points: 0, text: 'Transactions', percent: '0%', flag: 1, subtext: '0% up compared to last ' + day + ' days' },
    { id: 4, points: 0, text: 'Revenue', percent: '0%', flag: 1, subtext: '0% up compared to last ' + day + ' days' },
  ];
  return res.json(ok({
    dropDown: [
      { key: 1, value: 1, text: 'Today' },
      { key: 7, value: 7, text: 'Last 7 Days' },
      { key: 15, value: 15, text: 'Last 15 Days' },
      { key: 30, value: 30, text: 'Last 30 Days' },
    ],
    data,
    lifetimeRevenue: '₹ 0.00',
  }, 'Successfully fetched data'));
});

module.exports = { router, auth };
