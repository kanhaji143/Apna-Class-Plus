'use strict';
/**
 * Apna Class Plus — server entry
 * Express + node:sqlite — original Classplus DIY ke API shape ka clone
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { router: authRouter } = require('./routes/auth');
const { router: landingPagesRouter } = require('./routes/landingPages');
const { router: coursesRouter } = require('./routes/courses');
const { router: batchesRouter } = require('./routes/batches');
const { router: chatRouter } = require('./routes/chat');
const { router: campaignsRouter } = require('./routes/campaigns');
const { router: analyticsRouter } = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ contentSecurityPolicy: false })); // CSP off for dev (iframe previews)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// request log (Evidence ke liye)
app.use((req, res, next) => {
  if (req.path !== '/health') {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  }
  next();
});

// ---------- health ----------
app.get('/health', (req, res) => res.json({ status: 'success', data: { ok: true, ts: Date.now() }, message: 'Server healthy' }));

// ---------- routes ----------
app.use('/', authRouter);
app.use('/', landingPagesRouter);
app.use('/', coursesRouter);
app.use('/', batchesRouter);
app.use('/', chatRouter);
app.use('/', campaignsRouter);
app.use('/', analyticsRouter);

// ---------- 404 + error ----------
app.use((req, res) => res.status(404).json({ status: 'error', data: null, message: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ status: 'error', data: null, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Apna Class Plus server chalu: http://localhost:${PORT}`);
  console.log(`   Login flow: POST /v1/diy/generateOtp -> verifyOtp -> user/login`);
  console.log(`   Sidebar:    GET  /v1/diy/configuration/tabs (x-access-token)\n`);
});
