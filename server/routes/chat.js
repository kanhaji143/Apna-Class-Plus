'use strict';
/**
 * Chat routes (Phase 7) — polling-based 1:1 chat
 * Endpoints: /v2/chat/conversations, /v2/chat/messages, /v2/chat/send, /v2/chat/read
 */
const express = require('express');
const { db } = require('../db/init');
const { auth } = require('./auth');

const router = express.Router();
const ok = (data, message = 'successful') => ({ status: 'success', data, message });
const fail = (message) => ({ status: 'error', data: null, message });

// ---------- GET /v2/chat/conversations (list of chat partners) ----------
router.get('/v2/chat/conversations', auth, (req, res) => {
  const uid = req.user.id;
  // Find all users this user has chatted with
  const partners = db.prepare(`
    SELECT DISTINCT
      CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS partner_id
    FROM chats WHERE sender_id = ? OR receiver_id = ?
  `).all(uid, uid, uid);

  const result = partners.map((p) => {
    const user = db.prepare('SELECT id, name, phone, role FROM users WHERE id=?').get(p.partner_id);
    const lastMsg = db.prepare(
      'SELECT message, created_at, sender_id FROM chats WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY id DESC LIMIT 1'
    ).get(uid, p.partner_id, p.partner_id, uid);
    const unread = db.prepare(
      'SELECT COUNT(*) AS c FROM chats WHERE receiver_id=? AND sender_id=? AND read_at IS NULL'
    ).get(uid, p.partner_id).c;
    return { ...user, lastMessage: lastMsg?.message || '', lastMessageAt: lastMsg?.created_at || '', unreadCount: unread, isMine: lastMsg?.sender_id === uid };
  });

  return res.json(ok(result, 'Conversations fetched'));
});

// ---------- GET /v2/chat/messages?with=userId&since=timestamp ----------
router.get('/v2/chat/messages', auth, (req, res) => {
  const uid = req.user.id;
  const withId = parseInt(req.query.with, 10);
  if (!withId) return res.status(400).json(fail('with (userId) required'));
  const since = req.query.since || '1970-01-01';

  const msgs = db.prepare(
    `SELECT id, sender_id, receiver_id, message, read_at, created_at
     FROM chats
     WHERE ((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?))
       AND created_at > ?
     ORDER BY id ASC`
  ).all(uid, withId, withId, uid, since);

  // mark as read
  db.prepare('UPDATE chats SET read_at=datetime(\'now\') WHERE receiver_id=? AND sender_id=? AND read_at IS NULL').run(uid, withId);

  return res.json(ok(msgs, 'Messages fetched'));
});

// ---------- POST /v2/chat/send ----------
router.post('/v2/chat/send', auth, (req, res) => {
  const { receiverId, message } = req.body || {};
  if (!receiverId || !message) return res.status(400).json(fail('receiverId, message required'));
  const r = db.prepare('INSERT INTO chats (sender_id, receiver_id, message) VALUES (?,?,?)').run(req.user.id, receiverId, message);
  return res.json(ok(db.prepare('SELECT * FROM chats WHERE id=?').get(r.lastInsertRowid), 'Message sent'));
});

// ---------- GET /v2/chat/unread-count ----------
router.get('/v2/chat/unread-count', auth, (req, res) => {
  const c = db.prepare('SELECT COUNT(*) AS n FROM chats WHERE receiver_id=? AND read_at IS NULL').get(req.user.id);
  return res.json(ok({ count: c.n }, 'Unread count'));
});

// ---------- GET /v2/chat/users (list students/teachers to chat with) ----------
router.get('/v2/chat/users', auth, (req, res) => {
  const uid = req.user.id;
  const role = req.query.role || 'student';
  const users = db.prepare('SELECT id, name, phone, role FROM users WHERE role=? AND id != ? ORDER BY name').all(role, uid);
  return res.json(ok(users, 'Users fetched'));
});

module.exports = { router };