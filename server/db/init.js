'use strict';
/**
 * Apna Class Plus — DB layer
 * node:sqlite (Node 22+) — better-sqlite3-jaisa synchronous API, zero native deps.
 * JSON columns se Mongo-jaisa document shape (original Classplus MongoDB pattern).
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'diy.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'teacher',        -- admin | teacher | student
  password_hash TEXT,
  org_id INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS otps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL
);

-- API-driven sidebar config (original: /v1/diy/configuration/tabs)
CREATE TABLE IF NOT EXISTS tab_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT,
  active_icon TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  add_on_key TEXT,
  sub_menu TEXT,                               -- JSON array
  feature_flags TEXT                           -- JSON: {isLandingPageEnabled: true, ...}
);

-- Phase 3: Landing Page Builder
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,                         -- webinar | course | form
  name TEXT NOT NULL,
  description TEXT,
  sections TEXT NOT NULL                       -- JSON: default sections array
);

CREATE TABLE IF NOT EXISTS landing_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  template_id TEXT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  type TEXT DEFAULT 'Course Page',
  sections TEXT,                               -- JSON array
  theme TEXT,                                  -- JSON object
  status TEXT DEFAULT 'draft',                 -- draft | published
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  course_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  parent_id INTEGER,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS batch_students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  enrolled_at TEXT DEFAULT (datetime('now')),
  UNIQUE(batch_id, student_id)
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  price REAL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  description TEXT,
  status TEXT DEFAULT 'active',                -- active | archived
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  folder_id INTEGER,
  type TEXT NOT NULL,                          -- video | pdf | live | test | youtube
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  duration INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  channel TEXT DEFAULT 'SMS',                  -- SMS | Email | WhatsApp
  audience_json TEXT,                          -- {type: all|course|batch|leads, id: X}
  message TEXT,
  status TEXT DEFAULT 'draft',                 -- draft | published
  sent_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                          -- page_view | lead | conversion | purchase
  page_id INTEGER,
  user_id INTEGER,
  meta TEXT,                                   -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  course_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  duration_min INTEGER DEFAULT 30,
  status TEXT DEFAULT 'draft',                 -- draft | published
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS test_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct TEXT NOT NULL,                       -- a | b | c | d
  marks INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  student_name TEXT,
  student_phone TEXT,
  answers_json TEXT,                           -- {qid: 'a'}
  score INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  submitted_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS free_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  type TEXT DEFAULT 'pdf',                     -- video | pdf | youtube
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  status TEXT DEFAULT 'published',             -- draft | published
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

// ---------- seed ----------
function seed() {
  const hasUser = db.prepare('SELECT COUNT(*) AS c FROM users').get();
  if (hasUser.c === 0) {
    db.prepare('INSERT INTO users (name, phone, role) VALUES (?, ?, ?)')
      .run('Demo Teacher', '9999999999', 'teacher');
    console.log('[seed] demo teacher created: phone 9999999999');
  }
  const hasTabs = db.prepare('SELECT COUNT(*) AS c FROM tab_config').get();
  if (hasTabs.c === 0) {
    // Original Classplus DIY ke live-captured sidebar se
    const tabs = [
      ['Dashboard', '', 'dashboard', 1, null, null],
      ['Website', 'website', 'web', 2, 'isWebsiteEnabled', [{ title: 'Manage Pages', slug: 'website/manage-pages' }, { title: 'Domain Integration', slug: 'website/manage-domain' }]],
      ['Courses', 'courses', 'course', 3, null, [{ title: 'My Courses', slug: 'courses/course-list' }, { title: 'Global Courses', slug: 'courses/global-courses' }, { title: 'Manage Coupons', slug: 'courses/manage-coupons' }]],
      ['Content', 'content', 'material', 4, null, [{ title: 'Test Portal', slug: 'content/test-portal' }, { title: 'Free Material', slug: 'content/free-material' }]],
      ['Your App', 'app', 'app', 5, null, [{ title: 'Configure App', slug: 'app/your-app' }, { title: 'Manage Banners', slug: 'app/manage-banners' }]],
      ['Landing Pages', 'landing-pages/list', 'landing-page', 6, 'isLandingPageEnabled', null],
      ['1:1 Sessions', 'meet-pro', 'meet-pro', 7, null, null],
      ['Chats', 'chat', 'chat', 8, null, null],
      ['Analytics', 'analytics/sales-traffic', 'analytics', 9, null, null],
      ['Campaigns', 'campaigns', 'campaign', 10, null, null],
      ['People', 'people', 'people', 11, null, null],
    ];
    for (const [title, slug, icon, order, addon, sub] of tabs) {
      db.prepare('INSERT INTO tab_config (title, slug, icon, sort_order, add_on_key, sub_menu) VALUES (?,?,?,?,?,?)')
        .run(title, slug, icon, order, addon, sub ? JSON.stringify(sub) : null);
    }
    console.log('[seed] sidebar tabs seeded (' + tabs.length + ')');
  }
  const flags = db.prepare("SELECT value FROM settings WHERE key='featureFlags'").get();
  if (!flags) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('featureFlags', ?)").run(
      JSON.stringify({ isWebsiteEnabled: true, isLandingPageEnabled: true, isCoursesEnabled: true })
    );
  }

  // ---------- Phase 3: seed templates + demo courses ----------
  const HERO = { id: 'hero', type: 'HERO', props: { headline: 'Best Coaching in Town', subheadline: 'Padhai jo result deti hai', ctaText: 'Start Learning', ctaLink: '#lead-form', bgImage: '' } };
  const BANNER = { id: 'banner', type: 'BANNER_STRIP', props: { text: '⭐ Free demo lecture every Sunday — Call 98XXXXXXXX', speed: 20 } };
  const FEATURES = {
    id: 'features', type: 'FEATURES', props: { items: [
      { icon: '🎯', title: 'Doubt Sessions', desc: 'Daily live doubt clearing' },
      { icon: '📚', title: 'NCERT PDFs', desc: 'Complete study material' },
      { icon: '⏱', title: 'Test Series', desc: 'Weekly tests with analysis' },
    ] },
  };
  const TESTIMONIALS = {
    id: 'testimonials', type: 'TESTIMONIALS', props: { items: [
      { quote: 'Maine 68% se 92% kiya!', name: 'Ravi, Class 10', rating: 5 },
      { quote: 'Teachers bahut supportive hain.', name: 'Meena, Class 12', rating: 5 },
      { quote: 'Test series best hai.', name: 'Arjun, Class 9', rating: 4 },
    ] },
  };
  const PRICING = {
    id: 'pricing', type: 'PRICING', props: { plans: [
      { name: 'Basic', price: 499, strike: 999, features: ['Recorded lectures', 'PDFs'], ctaText: 'Buy Now' },
      { name: 'Pro', price: 999, strike: 1999, features: ['Recorded lectures', 'PDFs', 'Live classes'], ctaText: 'Buy Now' },
      { name: 'Elite', price: 1999, strike: 3999, features: ['Everything in Pro', '1:1 mentoring', 'Test series'], ctaText: 'Buy Now' },
    ] },
  };
  const FAQ = {
    id: 'faq', type: 'FAQ', props: { items: [
      { q: 'Kya demo free hai?', a: 'Haan, har Sunday free demo lecture hota hai.' },
      { q: 'Batch kab start hoga?', a: 'Har mahine ki 1st tarikh ko new batch start hota hai.' },
      { q: 'Refund milega?', a: '7 din ke andar full refund policy hai.' },
    ] },
  };
  const FOOTER = { id: 'footer', type: 'FOOTER', props: { contact: '📞 98XXXXXXXX · email@example.com', links: [{ text: 'About Us', url: '#' }, { text: 'Courses', url: '#' }], social: [{ text: 'Instagram', url: '#' }, { text: 'Telegram', url: '#' }] } };

  const templates = [
    { id: 'webinar', name: 'Webinar Page', description: 'Free/paid webinar promote karne ke liye. E.g. — Digital Marketing webinar 20% discount', sections: [HERO, BANNER, FEATURES, TESTIMONIALS, FAQ, FOOTER] },
    { id: 'course', name: 'Course Page', description: 'Course promote karke sales badhao. E.g. — Stock trading course 50% off announce karo', sections: [HERO, BANNER, FEATURES, PRICING, TESTIMONIALS, FAQ, FOOTER] },
    { id: 'form', name: 'Form Page', description: 'Leads generate karo ya feedback lo. E.g. — Students se coaching rating survey', sections: [HERO, FEATURES, FOOTER] },
  ];
  const hasTpl = db.prepare('SELECT COUNT(*) AS c FROM templates').get();
  if (hasTpl.c === 0) {
    for (const t of templates) {
      db.prepare('INSERT INTO templates (id, name, description, sections) VALUES (?,?,?,?)')
        .run(t.id, t.name, t.description, JSON.stringify(t.sections));
    }
    console.log('[seed] 3 landing page templates seeded (webinar/course/form)');
  }

  const hasCourses = db.prepare('SELECT COUNT(*) AS c FROM courses').get();
  if (hasCourses.c === 0) {
    const courses = [
      ['Class 10 Maths Complete Course', 999, 'NCERT Class 10 maths — Pass Mode + Topper Mode'],
      ['Class 12 Physics Crash Course', 1499, 'Complete physics revision + test series'],
      ['Free Demo — Study Skills', 0, 'Free workshop: kaise top karein exams mein'],
    ];
    for (const [title, price, desc] of courses) {
      db.prepare('INSERT INTO courses (owner_id, title, price, description) VALUES (1, ?, ?, ?)').run(title, price, desc);
    }
    console.log('[seed] 3 demo courses seeded (wizard ke liye)');
  }
}

seed();

module.exports = { db };
