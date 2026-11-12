'use strict';
/**
 * Courses & Content routes (Phase 4)
 * Original endpoints matched: /v2/courses, /v2/course/content/*, /v2/users/getS3SignedUrl, /v2/course/reorder/contents
 */
const express = require('express');
const { db } = require('../db/init');
const { auth } = require('./auth');

const router = express.Router();
const ok = (data, message = 'successful') => ({ status: 'success', data, message });
const fail = (message) => ({ status: 'error', data: null, message });

// ---------- POST /v2/courses (create) ----------
router.post('/v2/courses', auth, (req, res) => {
  const { title, price, currency, description } = req.body || {};
  if (!title) return res.status(400).json(fail('title required'));
  const r = db.prepare('INSERT INTO courses (owner_id, title, price, currency, description) VALUES (?,?,?,?,?)')
    .run(req.user.id, title, price || 0, currency || 'INR', description || '');
  const c = db.prepare('SELECT * FROM courses WHERE id=?').get(r.lastInsertRowid);
  return res.json(ok(c, 'Course created'));
});

// ---------- GET /v2/courses/:id ----------
router.get('/v2/courses/:id', auth, (req, res) => {
  const c = db.prepare('SELECT * FROM courses WHERE id=? AND owner_id=?').get(req.params.id, req.user.id);
  if (!c) return res.status(404).json(fail('Course not found'));
  return res.json(ok(c, 'Course fetched'));
});

// ---------- PUT /v2/courses/:id ----------
router.put('/v2/courses/:id', auth, (req, res) => {
  const { title, price, currency, description, status } = req.body || {};
  const c = db.prepare('SELECT id FROM courses WHERE id=? AND owner_id=?').get(req.params.id, req.user.id);
  if (!c) return res.status(404).json(fail('Course not found'));
  db.prepare('UPDATE courses SET title=COALESCE(?,title), price=COALESCE(?,price), currency=COALESCE(?,currency), description=COALESCE(?,description), status=COALESCE(?,status) WHERE id=?')
    .run(title, price, currency, description, status, req.params.id);
  return res.json(ok(db.prepare('SELECT * FROM courses WHERE id=?').get(req.params.id), 'Course updated'));
});

// ---------- DELETE /v2/courses/:id (archive) ----------
router.delete('/v2/courses/:id', auth, (req, res) => {
  db.prepare("UPDATE courses SET status='archived' WHERE id=? AND owner_id=?").run(req.params.id, req.user.id);
  return res.json(ok({ archived: true }, 'Course archived'));
});

// ---------- POST /v2/course/content/add ----------
router.post('/v2/course/content/add', auth, (req, res) => {
  const { courseId, type, title, url, folderId, description, duration } = req.body || {};
  if (!courseId || !type || !title) return res.status(400).json(fail('courseId, type, title required'));
  const c = db.prepare('SELECT id FROM courses WHERE id=? AND owner_id=?').get(courseId, req.user.id);
  if (!c) return res.status(404).json(fail('Course not found'));
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order),0) AS m FROM contents WHERE course_id=?').get(courseId).m;
  const r = db.prepare('INSERT INTO contents (course_id, folder_id, type, title, url, description, duration, sort_order) VALUES (?,?,?,?,?,?,?,?)')
    .run(courseId, folderId || null, type, title, url || '', description || '', duration || 0, maxOrder + 1);
  return res.json(ok(db.prepare('SELECT * FROM contents WHERE id=?').get(r.lastInsertRowid), 'Content added'));
});

// ---------- GET /v2/course/content/get (list by course) ----------
router.get('/v2/course/content/get', auth, (req, res) => {
  const courseId = req.query.courseId;
  if (!courseId) return res.status(400).json(fail('courseId required'));
  const contents = db.prepare('SELECT * FROM contents WHERE course_id=? ORDER BY sort_order, id').all(courseId);
  const folders = db.prepare('SELECT * FROM folders WHERE course_id=? ORDER BY sort_order, id').all(courseId);
  return res.json(ok({ contents, folders }, 'Content fetched'));
});

// ---------- PUT /v2/course/content/edit/:id ----------
router.put('/v2/course/content/edit/:id', auth, (req, res) => {
  const { title, url, description, duration, folderId } = req.body || {};
  const row = db.prepare('SELECT c.id FROM contents c JOIN courses co ON co.id=c.course_id WHERE c.id=? AND co.owner_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json(fail('Content not found'));
  db.prepare('UPDATE contents SET title=COALESCE(?,title), url=COALESCE(?,url), description=COALESCE(?,description), duration=COALESCE(?,duration), folder_id=COALESCE(?,folder_id) WHERE id=?')
    .run(title, url, description, duration, folderId, req.params.id);
  return res.json(ok(db.prepare('SELECT * FROM contents WHERE id=?').get(req.params.id), 'Content updated'));
});

// ---------- DELETE /v2/course/content/delete/:id ----------
router.delete('/v2/course/content/delete/:id', auth, (req, res) => {
  const row = db.prepare('SELECT c.id FROM contents c JOIN courses co ON co.id=c.course_id WHERE c.id=? AND co.owner_id=?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json(fail('Content not found'));
  db.prepare('DELETE FROM contents WHERE id=?').run(req.params.id);
  return res.json(ok({ deleted: true }, 'Content deleted'));
});

// ---------- POST /v2/course/reorder/contents ----------
router.post('/v2/course/reorder/contents', auth, (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) return res.status(400).json(fail('array of {id, order} required'));
  const stmt = db.prepare('UPDATE contents SET sort_order=? WHERE id=?');
  for (const it of items) stmt.run(it.order ?? it.sort_order, it.id);
  return res.json(ok({ reordered: true }, 'Contents reordered'));
});

// ---------- folders (create + list) ----------
router.post('/v2/course/folder/add', auth, (req, res) => {
  const { courseId, name, parentId } = req.body || {};
  if (!courseId || !name) return res.status(400).json(fail('courseId, name required'));
  const r = db.prepare('INSERT INTO folders (course_id, parent_id, name) VALUES (?,?,?)').run(courseId, parentId || null, name);
  return res.json(ok(db.prepare('SELECT * FROM folders WHERE id=?').get(r.lastInsertRowid), 'Folder created'));
});

// ---------- GET /v2/users/getS3SignedUrl (mock — real S3 Phase 4.5) ----------
router.get('/v2/users/getS3SignedUrl', auth, (req, res) => {
  const { filename, type } = req.query;
  // dev: return a placeholder public URL (real S3 presigned flow later)
  return res.json(ok({
    uploadUrl: 'http://localhost:4000/dev-upload?filename=' + encodeURIComponent(filename || 'file'),
    publicUrl: 'https://cdn-diy-public.classplus.co/dev/' + encodeURIComponent(filename || 'file'),
    key: 'dev/' + (filename || 'file'),
  }, 'Signed URL generated (dev mock)'));
});

module.exports = { router };
