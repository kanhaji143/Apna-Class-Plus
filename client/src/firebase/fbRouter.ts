/**
 * fbRouter — API endpoint shapes ko Firestore pe map karta hai.
 * Pages ka code UNCHANGED rehta hai: api client FB_MODE mein har call yahan route hota hai.
 * Scoring client-side (Spark plan: no Cloud Functions) — demo trade-off documented.
 */
import {
  db, auth, nextId, qGet, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, tsNow, writeBatch,
} from './fb';

// ---------- auth ----------
export interface FbUser { uid: string; name: string; email: string; role: string; phone: string; plan: string; trialEnd: string | null; }

async function ensureProfile(uid: string, email: string, name: string): Promise<FbUser> {
  const ref = doc(db(), 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const cfgRef = doc(db(), 'config', 'roles');
    const cfgSnap = await getDoc(cfgRef);
    const isSuper = !cfgSnap.exists();
    if (isSuper) await setDoc(cfgRef, { superAdminUid: uid, createdAt: tsNow() });
    const now = Date.now();
    const trialEnd = isSuper ? null : new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    await setDoc(ref, {
      name: name || email.split('@')[0], email, phone: '',
      role: isSuper ? 'superadmin' : 'teacher',
      plan: isSuper ? 'active' : 'trial',
      trialStart: isSuper ? null : new Date(now).toISOString(),
      trialEnd,
      instituteId: null,
      createdAt: tsNow(),
    });
  }
  const d = snap.exists() ? snap.data() : (await getDoc(ref)).data();
  return { uid, name: d?.name || name, email: d?.email || email, role: d?.role || 'teacher', phone: d?.phone || '',
    plan: d?.plan || 'trial', trialEnd: d?.trialEnd || null };
}

export const fbSignup = async (name: string, email: string, password: string): Promise<FbUser> => {
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  const cred = await createUserWithEmailAndPassword(auth(), email, password);
  return ensureProfile(cred.user.uid, email, name);
};

export const fbLogin = async (email: string, password: string): Promise<FbUser> => {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const cred = await signInWithEmailAndPassword(auth(), email, password);
  return ensureProfile(cred.user.uid, cred.user.email || email, '');
};

export const fbLogout = async () => {
  const { signOut } = await import('firebase/auth');
  await signOut(auth());
};

export const fbBootstrap = async (): Promise<FbUser | null> => {
  const { onAuthStateChanged } = await import('firebase/auth');
  const a = auth();
  const cur = await new Promise<any>((resolve) => {
    const unsub = onAuthStateChanged(a, (u) => { unsub(); resolve(u); });
  });
  if (!cur) return null;
  return ensureProfile(cur.uid, cur.email || '', '');
};

export const getOwnerUid = (): string => auth().currentUser?.uid || '';

// ---------- path router ----------
export async function route(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: any): Promise<any> {
  const dbv = db();
  const ownerUid = getOwnerUid();
  const seg = path.split('?')[0].split('/').filter(Boolean);

  // ---------- landing pages ----------
  if (seg[2] === 'landingPages') {
    if (method === 'GET' && seg.length === 3) {
      const pages = await qGet<any>('pages', { wheres: [['ownerUid', '==', ownerUid]] });
      pages.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      return { data: pages.map((p: any) => ({ _id: p.id, id: p.id, title: p.title, slug: p.slug, status: p.status, createdAt: p.createdAt })) };
    }
    if (method === 'POST' && seg.length === 3) {
      const tpl = getTemplates().find((t: any) => t.id === (body?.templateId ?? 1)) || getTemplates()[0];
      const id = await nextId(dbv, 'pages');
      const title = body?.title || tpl?.name || 'Untitled Page';
      await setDoc(doc(dbv, 'pages', String(id)), {
        id, ownerUid, title, slug: null, status: 'draft',
        sections: tpl?.sections || [], theme: tpl?.theme || null, courseId: body?.courseId || null,
        createdAt: tsNow(),
      });
      return { _id: id, title, slug: null, status: 'draft' };
    }
    if (method === 'GET' && seg.length === 4) {
      const snap = await getDoc(doc(dbv, 'pages', seg[3]));
      if (!snap.exists()) throw new Error('Page not found');
      return snap.data();
    }
    if (method === 'PUT' && seg[3] === 'section' && seg[4] === 'form') {
      await updateDoc(doc(dbv, 'pages', String(body.pageId)), {
        sections: body.sections || [], theme: body.theme || null, title: body.title || '',
      });
      return { saved: true };
    }
    if (method === 'POST' && seg.length === 5 && seg[4] === 'publish') {
      const ref = doc(dbv, 'pages', seg[3]);
      const snap = await getDoc(ref);
      const p = snap.data() || {};
      let slug = p.slug;
      if (!slug) {
        slug = (p.title || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + seg[3];
        await updateDoc(ref, { slug });
      }
      await updateDoc(ref, { status: 'published' });
      const after = await getDoc(ref);
      return { publicUrl: `/lp-preview/${slug}`, slug, status: 'published', ...(after.data() as object) };
    }
    if (method === 'DELETE' && seg.length === 4) {
      await deleteDoc(doc(dbv, 'pages', seg[3]));
      return { deleted: true };
    }
  }

  // ---------- public landing by slug ----------
  if (seg[1] === 'lp' && seg[2] === 'api' && method === 'GET' && seg.length === 4) {
    const snap = await getDocs(query(collection(dbv, 'pages'), where('slug', '==', seg[3])));
    const d = snap.docs[0]?.data();
    if (!d) throw new Error('Page not found');
    return { title: d.title, sections: d.sections || [], theme: d.theme, ownerUid: d.ownerUid };
  }

  // ---------- free materials ----------
  if (path.startsWith('/v3/free-materials')) {
    if (method === 'GET' && seg.length === 2) {
      const items = await qGet<any>('freeMaterials', { wheres: [['ownerUid', '==', ownerUid]] });
      items.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
      return items;
    }
    if (method === 'GET' && seg[2] === 'public') {
      const items = await qGet<any>('freeMaterials', { wheres: [['status', '==', 'published']] });
      items.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
      return { teacherName: 'Teacher', items };
    }
    if (method === 'POST' && seg.length === 2) {
      const mine = await qGet<any>('freeMaterials', { wheres: [['ownerUid', '==', ownerUid]] });
      mine.sort((a: any, b: any) => (b.sort_order || 0) - (a.sort_order || 0));
      const max = mine.slice(0, 1);
      const id = await nextId(dbv, 'freeMaterials');
      await setDoc(doc(dbv, 'freeMaterials', String(id)), {
        id, ownerUid, ...body, sort_order: (max[0]?.sort_order || 0) + 1, createdAt: tsNow(),
      });
      return { id, ...body };
    }
    if (method === 'PUT' && seg.length === 3) { await updateDoc(doc(dbv, 'freeMaterials', seg[2]), body); return { updated: true }; }
    if (method === 'DELETE' && seg.length === 3) { await deleteDoc(doc(dbv, 'freeMaterials', seg[2])); return { deleted: true }; }
  }

  if (seg[1] === 'lp' && seg[2] === 'api' && seg[3] === 'free-materials' && method === 'GET') {
    const items = await qGet<any>('freeMaterials', { wheres: [['status', '==', 'published']] });
    items.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    const first = items[0];
    let teacherName = 'Apna Class Plus';
    if (first) {
      try {
        const u = await getDoc(doc(dbv, 'users', first.ownerUid));
        if (u.exists() && u.data()?.name) teacherName = u.data().name;
      } catch { /* public visitor — brand name */ }
    }
    return { teacherName, items };
  }

  // ---------- tests ----------
  if (path.startsWith('/v3/tests') || path.startsWith('/v3/attempts')) {
    if (method === 'GET' && seg[1] === 'tests' && seg.length === 2) {
      const tests = await qGet<any>('tests', { wheres: [['ownerUid', '==', ownerUid]] });
      tests.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      return tests.map((t: any) => ({
        ...t,
        question_count: t.question_count ?? t._qc ?? 0,
        attempt_count: t.attempt_count ?? t._ac ?? 0,
        section_count: t.section_count ?? t._sc ?? 0,
      }));
    }
    if (method === 'POST' && seg[1] === 'tests' && seg.length === 2) {
      const id = await nextId(dbv, 'tests');
      await setDoc(doc(dbv, 'tests', String(id)), {
        id, ownerUid, title: body.title, description: body.description || null,
        durationMin: body.durationMin || 30, reattemptMode: !!body.reattemptMode,
        courseId: body.courseId || null, status: 'draft', createdAt: tsNow(),
      });
      return { id, ...body, status: 'draft' };
    }
    if (seg[1] === 'tests' && seg.length >= 3) {
      const tref = doc(dbv, 'tests', seg[2]);
      if (method === 'GET' && seg[3] === 'full') {
        const tsnap = await getDoc(tref);
        if (!tsnap.exists()) throw new Error('Test not found');
        const test = tsnap.data();
        const sections = await qGet<any>(`tests/${seg[2]}/sections`, { orderField: 'sort_order', orderDir: 'asc' });
        const questions = await qGet<any>(`tests/${seg[2]}/questions`, { orderField: 'sort_order', orderDir: 'asc' });
        const attempts = await qGet<any>(`tests/${seg[2]}/attempts`, { orderField: 'id', orderDir: 'desc', limit: 100 });
        return { test, sections, questions, attempts };
      }
      if (method === 'GET' && seg[3] === 'attempts') {
        const attempts = await qGet<any>(`tests/${seg[2]}/attempts`, { orderField: 'id', orderDir: 'desc' });
        const questions = await qGet<any>(`tests/${seg[2]}/questions`, { orderField: 'sort_order', orderDir: 'asc' });
        return { attempts, questions };
      }
      if (method === 'POST' && seg[3] === 'publish') {
        const qs = await getDocs(collection(dbv, `tests/${seg[2]}/questions`));
        if (qs.empty) throw new Error('Publish se pehle kam se kam 1 question add karo');
        await updateDoc(tref, { status: 'published' });
        const after = await getDoc(tref);
        return { ...(after.data() as object) };
      }
      if (method === 'POST' && seg[3] === 'sections') {
        const secs = await qGet<any>(`tests/${seg[2]}/sections`, { orderField: 'sort_order', orderDir: 'desc', limit: 1 });
        const id = await nextId(dbv, 'sections');
        await setDoc(doc(dbv, `tests/${seg[2]}/sections`, String(id)), { id, name: body.name, sort_order: (secs[0]?.sort_order || 0) + 1 });
        return { id, name: body.name };
      }
      if (method === 'DELETE' && seg[3] === 'sections' && seg.length === 5) {
        const qs = await getDocs(query(collection(dbv, `tests/${seg[2]}/questions`), where('section_id', '==', Number(seg[4]))));
        const b = writeBatch(dbv);
        qs.docs.forEach((d) => b.update(d.ref, { section_id: null }));
        b.delete(doc(dbv, `tests/${seg[2]}/sections`, seg[4]));
        await b.commit();
        return { deleted: true };
      }
      if (method === 'POST' && seg[3] === 'questions') {
        return addQuestion(dbv, seg[2], body);
      }
      if (method === 'POST' && seg[3] === 'import') {
        let n = 0;
        for (const q of body.questions || []) { await addQuestion(dbv, seg[2], q); n++; }
        return { inserted: n };
      }
      if (method === 'DELETE' && seg[3] === 'questions' && seg.length === 5) {
        await deleteDoc(doc(dbv, `tests/${seg[2]}/questions`, seg[4]));
        return { deleted: true };
      }
      if (method === 'PUT' && seg.length === 3) {
        const upd: any = {};
        if (body.title !== undefined) upd.title = body.title;
        if (body.description !== undefined) upd.description = body.description;
        if (body.durationMin !== undefined) upd.durationMin = body.durationMin;
        if (body.reattemptMode !== undefined) upd.reattemptMode = !!body.reattemptMode;
        if (body.courseId !== undefined) upd.courseId = body.courseId;
        await updateDoc(tref, upd);
        const after = await getDoc(tref);
        return { ...(after.data() as object) };
      }
      if (method === 'DELETE' && seg.length === 3) {
        for (const sub of ['questions', 'sections', 'attempts']) {
          const docs = await getDocs(collection(dbv, `tests/${seg[2]}/${sub}`));
          const b = writeBatch(dbv);
          docs.docs.forEach((d) => b.delete(d.ref));
          await b.commit();
        }
        await deleteDoc(tref);
        return { deleted: true };
      }
    }
    if (method === 'POST' && seg[3] === 'import-parse') {
      return parseBulkText(body.text || '');
    }
  }
  if (method === 'POST' && seg[1] === 'attempts' && seg[3] === 'grade') {
    const { collectionGroup } = await import('firebase/firestore');
    const ag = await getDocs(query(collectionGroup(dbv, 'attempts'), where('id', '==', Number(seg[2]))));
    const a = ag.docs[0]?.data();
    const aref = ag.docs[0]?.ref;
    if (!aref || !a) throw new Error('Attempt not found');
    const tid = String(aref.parent.parent!.id);
    return gradeAttempt(dbv, tid, aref, a, body.scores || {});
  }

  // ---------- PUBLIC test endpoints ----------
  if (seg[0] === 'public' && seg[1] === 'test') {
    const tid = seg[2];
    if (method === 'GET' && seg.length === 3) {
      const tsnap = await getDoc(doc(dbv, 'tests', tid));
      const t = tsnap.data();
      if (!t || t.status !== 'published') throw new Error('Test not available');
      const sections = await qGet<any>(`tests/${tid}/sections`, { orderField: 'sort_order', orderDir: 'asc' });
      const questions = await qGet<any>(`tests/${tid}/questions`, { orderField: 'sort_order', orderDir: 'asc' });
      return {
        test: { id: Number(tid), title: t.title, description: t.description, duration_min: t.durationMin, status: t.status, reattempt_mode: t.reattemptMode ? 1 : 0 },
        sections, questions,
      };
    }
    if (method === 'POST' && seg.length === 4 && seg[3] === 'submit') {
      try {
        const tsnap = await getDoc(doc(dbv, 'tests', tid));
        const t = tsnap.data();
        if (!t || t.status !== 'published') throw new Error('Test not available');
        const questions = await qGet<any>(`tests/${tid}/questions`, { orderField: 'sort_order', orderDir: 'asc' });
        let autoScore = 0, total = 0, hasSubjective = false;
        const review: any = {};
        for (const q of questions) {
          total += q.marks || 1;
          const given = body.answers?.[q.id] !== undefined ? String(body.answers[q.id]) : '';
          if (q.type === 'subjective') {
            hasSubjective = true;
            review[q.id] = { type: 'subjective', given: given || null, ok: null, marks: q.marks, note: 'Teacher grading pending' };
            continue;
          }
          let isRight = false;
          if (q.type === 'objective') {
            const list = JSON.parse(q.accepted_answers || '[]').map((x: string) => String(x).trim().toLowerCase());
            isRight = list.includes(given.trim().toLowerCase());
          } else {
            isRight = given.toLowerCase() === q.correct;
          }
          review[q.id] = { type: q.type, given: given || null, correct: q.correct || null, ok: isRight, marks: q.marks };
          if (isRight) autoScore += q.marks;
        }
        const id = await nextId(dbv, 'attempts');
        await setDoc(doc(dbv, `tests/${tid}/attempts`, String(id)), {
          id, student_name: body.studentName || null, student_phone: body.studentPhone || null,
          answers_json: JSON.stringify(body.answers || {}),
          time_json: JSON.stringify(body.timeSpent || {}),
          manual_json: '{}', graded: hasSubjective ? 0 : 1, rated: 0,
          score: autoScore, total, submitted_at: new Date().toISOString(),
        });
        return { attemptId: id, score: autoScore, total, review, pendingGrading: hasSubjective };
      } catch (e: any) {
        throw new Error('SUBMIT-FAIL: ' + (e && e.message ? e.message : String(e)));
      }
    }
    if (method === 'POST' && seg.length === 5 && seg[3] === 'rate') {
      const aref = doc(dbv, `tests/${tid}/attempts`, String(body.attemptId));
      await updateDoc(aref, { rated: Math.max(1, Math.min(5, Number(body.stars) || 0)) });
      return { rated: body.stars };
    }
    if (method === 'GET' && seg.length === 5 && seg[3] === 'solution') {
      const qsnap = await getDoc(doc(dbv, `tests/${tid}/questions`, seg[4]));
      const q = qsnap.data();
      if (!q) throw new Error('Question not found');
      return {
        type: q.type, question: q.question,
        options: { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d },
        optionsHi: { a: q.option_a_hi, b: q.option_b_hi, c: q.option_c_hi, d: q.option_d_hi },
        questionHi: q.question_hi || null, explanationHi: q.explanation_hi || null,
        correct: q.type === 'objective' ? JSON.parse(q.accepted_answers || '[]') : q.correct || null,
        explanation: q.explanation || null,
      };
    }
  }

  // ---------- leads ----------
  if (seg[2] === 'leads' && method === 'POST') {
    const id = await nextId(dbv, 'leads');
    await setDoc(doc(dbv, 'leads', String(id)), { id, ownerUid: body.ownerUid || 'public', ...body, createdAt: tsNow() });
    return { id };
  }

  // ---------- dashboard stats ----------
  if (path.startsWith('/v1/diy/landingPage/dashboard')) {
    const pages = await qGet<any>('pages', { wheres: [['ownerUid', '==', ownerUid]] });
    const tests = await qGet<any>('tests', { wheres: [['ownerUid', '==', ownerUid]] });
    const materials = await qGet<any>('freeMaterials', { wheres: [['ownerUid', '==', ownerUid]] });
    const courses = await qGet<any>('courses', { wheres: [['ownerUid', '==', ownerUid]] });
    return { landingPageCount: pages.length, publishedCourseCount: courses.filter((c: any) => c.status === 'active').length, couponCount: 0, campaignCount: tests.length + materials.length };
  }
  if (path.startsWith('/v1/diy/analytcs/stats')) return { data: [] };

  // ---------- templates ----------
  if (path.startsWith('/v1/diy/templatePages')) return getTemplates();

  // ---------- user management (admin/superadmin) ----------
  if (seg[0] === 'v3' && seg[1] === 'users') {
    if (method === 'GET' && seg.length === 2) {
      const cfg = await getDoc(doc(dbv, 'config', 'roles'));
      const superUid = cfg.exists() ? cfg.data().superAdminUid : null;
      const isAdmin = ownerUid === superUid;
      if (!isAdmin) throw new Error('Admin access required');
      const users = await qGet<any>('users', { orderField: 'createdAt', orderDir: 'desc' });
      return users;
    }
    if (method === 'PUT' && seg.length === 4 && seg[3] === 'role') {
      const cfg = await getDoc(doc(dbv, 'config', 'roles'));
      const superUid = cfg.exists() ? cfg.data().superAdminUid : null;
      if (ownerUid !== superUid) throw new Error('Super-admin access required');
      await updateDoc(doc(dbv, 'users', seg[2]), { role: body.role });
      return { updated: true };
    }
    if (method === 'POST' && seg.length === 4 && seg[3] === 'extend-trial') {
      const cfg = await getDoc(doc(dbv, 'config', 'roles'));
      const superUid = cfg.exists() ? cfg.data().superAdminUid : null;
      const isAdmin = ownerUid === superUid;
      if (!isAdmin) throw new Error('Admin access required');
      const uref = doc(dbv, 'users', seg[2]);
      const usnap = await getDoc(uref);
      const u = usnap.data() || {};
      const base = u.trialEnd ? new Date(u.trialEnd) : new Date();
      const newEnd = new Date(Math.max(base.getTime(), Date.now()) + 7 * 24 * 60 * 60 * 1000).toISOString();
      await updateDoc(uref, { trialEnd: newEnd, plan: 'trial' });
      return { trialEnd: newEnd };
    }
  }

  // ---------- student store (public) ----------
  if (seg[0] === 'store' && method === 'GET') {
    // Composite-index se bachne ke liye: sirf status filter, sorting client-side
    const tests = await qGet<any>('tests', { wheres: [['status', '==', 'published']] });
    const materials = await qGet<any>('freeMaterials', { wheres: [['status', '==', 'published']] });
    const courses = await qGet<any>('courses', { wheres: [['status', '==', 'active']] });
    tests.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
    materials.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    courses.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
    // question counts per test (demo-scale N+1, theek hai)
    const withCounts = [];
    for (const t of tests) {
      let questionCount = 0;
      try { questionCount = (await getDocs(collection(dbv, `tests/${t.id}/questions`))).size; } catch { questionCount = 0; }
      withCounts.push({ id: t.id, title: t.title, description: t.description || null, durationMin: t.durationMin || 0, questionCount });
    }
    // public visitor users/{uid} nahi padh sakta — isliye getDoc optional (try/catch)
    let teacherName = 'Apna Class Plus';
    const ownerUid = tests[0]?.ownerUid || materials[0]?.ownerUid || courses[0]?.ownerUid;
    if (ownerUid) {
      try {
        const usnap = await getDoc(doc(dbv, 'users', ownerUid));
        if (usnap.exists() && usnap.data().name) teacherName = usnap.data().name;
      } catch { /* unauthenticated visitor — default brand name */ }
    }
    const courseCards = courses.map((c: any) => ({
      id: c.id, title: c.title, description: c.description || null,
      price: Number(c.price || 0), currency: c.currency || 'INR', ownerUid: c.ownerUid,
    }));
    return { teacherName, tests: withCounts, materials, courses: courseCards };
  }

  // ---------- courses (admin) ----------
  if (path.startsWith('/v2/courses')) {
    if (method === 'GET' && seg.length === 2) {
      const list = await qGet<any>('courses', { wheres: [['ownerUid', '==', ownerUid]] });
      list.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
      return { data: list };
    }
    if (method === 'POST' && seg.length === 2) {
      const id = await nextId(dbv, 'courses');
      await setDoc(doc(dbv, 'courses', String(id)), {
        id, ownerUid, title: body.title || 'Untitled Course',
        price: Number(body.price || 0), currency: 'INR',
        description: body.description || '', status: 'active', created_at: tsNow(),
      });
      return { id, ...body, currency: 'INR', status: 'active' };
    }
    if (method === 'GET' && seg.length === 3) {
      const snap = await getDoc(doc(dbv, 'courses', seg[2]));
      if (!snap.exists()) throw new Error('Course not found');
      return snap.data();
    }
    if (method === 'DELETE' && seg.length === 3) {
      await updateDoc(doc(dbv, 'courses', seg[2]), { status: 'archived' });
      return { archived: true, id: Number(seg[2]) };
    }
  }

  // ---------- course content & folders ----------
  if (seg[0] === 'v2' && seg[1] === 'course') {
    if (method === 'GET' && seg[2] === 'content' && seg[3] === 'get') {
      const cid = Number(new URLSearchParams(path.split('?')[1] || '').get('courseId') || 0);
      const contents = await qGet<any>('courseContents', { wheres: [['course_id', '==', cid], ['ownerUid', '==', ownerUid]] });
      const folders = await qGet<any>('courseFolders', { wheres: [['course_id', '==', cid], ['ownerUid', '==', ownerUid]] });
      contents.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
      folders.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
      return { contents, folders };
    }
    if (method === 'POST' && seg[2] === 'content' && seg[3] === 'add') {
      const courseId = Number(body.courseId);
      const existing = await qGet<any>('courseContents', { wheres: [['course_id', '==', courseId], ['ownerUid', '==', ownerUid]] });
      const id = await nextId(dbv, 'courseContents');
      await setDoc(doc(dbv, 'courseContents', String(id)), {
        id, course_id: courseId, ownerUid, folder_id: body.folderId ?? null,
        type: body.type || 'video', title: body.title || 'Untitled',
        url: body.url || '', description: body.description || '',
        duration: 0, sort_order: existing.length + 1, createdAt: tsNow(),
      });
      return { id };
    }
    if (method === 'DELETE' && seg[2] === 'content' && seg[3] === 'delete' && seg[4]) {
      await deleteDoc(doc(dbv, 'courseContents', seg[4]));
      return { deleted: true, id: Number(seg[4]) };
    }
    if (method === 'POST' && seg[2] === 'folder' && seg[3] === 'add') {
      const courseId = Number(body.courseId);
      const existing = await qGet<any>('courseFolders', { wheres: [['course_id', '==', courseId], ['ownerUid', '==', ownerUid]] });
      const id = await nextId(dbv, 'courseFolders');
      await setDoc(doc(dbv, 'courseFolders', String(id)), {
        id, course_id: courseId, ownerUid, parent_id: body.parentId ?? null,
        name: body.name || 'Folder', sort_order: existing.length + 1, createdAt: tsNow(),
      });
      return { id };
    }
    if (method === 'POST' && seg[2] === 'reorder' && seg[3] === 'contents') {
      const items = Array.isArray(body) ? body : [];
      for (const it of items) {
        await updateDoc(doc(dbv, 'courseContents', String(it.id)), { sort_order: Number(it.order) || 0 });
      }
      return { reordered: items.length };
    }
  }

  // ---------- baaki (batches/chat/campaigns/analytics/people) — FB mode core nahi ----------
  if (method === 'GET') {
    if (path.includes('campaignList') || path.includes('analytcs/stats')) return { data: [] };
    return [];
  }
  return { placeholder: true, feature: path };
}

// ---------- add question (type-aware) ----------
async function addQuestion(dbv: any, tid: string, body: any) {
  const qType = ['mcq', 'truefalse', 'objective', 'subjective'].includes(body.type) ? body.type : 'mcq';
  if (!body.question) throw new Error('question required');
  let finalOptions: any = { a: body.optionA, b: body.optionB, c: body.optionC, d: body.optionD };
  let finalCorrect = body.correct ? String(body.correct).toLowerCase() : '';
  let acceptedJson: string | null = null;

  if (qType === 'truefalse') {
    finalOptions = { a: 'True', b: 'False' };
    if (!['a', 'b'].includes(finalCorrect)) throw new Error('truefalse ke liye correct = a ya b');
  } else if (qType === 'mcq') {
    const hasA = body.optionA || body.optionAHi;
    const hasB = body.optionB || body.optionBHi;
    if (!hasA || !hasB) throw new Error('MCQ mein kam se kam 2 options chahiye (English ya Hindi)');
    if (!['a', 'b', 'c', 'd'].includes(finalCorrect)) throw new Error('correct must be a|b|c|d');
  } else if (qType === 'objective') {
    const list = Array.isArray(body.acceptedAnswers) ? body.acceptedAnswers.filter((x: string) => String(x).trim()) : (body.acceptedAnswers ? [String(body.acceptedAnswers)] : []);
    if (!list.length) throw new Error('objective ke liye acceptedAnswers chahiye');
    acceptedJson = JSON.stringify(list);
    finalOptions = { a: null, b: null, c: null, d: null };
    finalCorrect = '';
  } else {
    finalOptions = { a: null, b: null, c: null, d: null };
    finalCorrect = '';
  }
  const qs = await qGet<any>(`tests/${tid}/questions`, { orderField: 'sort_order', orderDir: 'desc', limit: 1 });
  const id = await nextId(dbv, 'questions');
  await setDoc(doc(dbv, `tests/${tid}/questions`, String(id)), {
    id,
    section_id: body.sectionId ? Number(body.sectionId) : null,
    type: qType, question: body.question,
    option_a: finalOptions.a || null, option_b: finalOptions.b || null, option_c: finalOptions.c || null, option_d: finalOptions.d || null,
    correct: finalCorrect, accepted_answers: acceptedJson,
    explanation: body.explanation || null,
    question_hi: body.questionHi || null,
    option_a_hi: body.optionAHi || null, option_b_hi: body.optionBHi || null, option_c_hi: body.optionCHi || null, option_d_hi: body.optionDHi || null,
    explanation_hi: body.explanationHi || null,
    marks: body.marks || 1, sort_order: (qs[0]?.sort_order || 0) + 1,
  });
  return { id, ...body };
}

// ---------- grade attempt ----------
async function gradeAttempt(_dbv: any, tid: string, aref: any, a: any, scores: any) {
  const questions = await qGet<any>(`tests/${tid}/questions`, {});
  let autoScore = 0, total = 0;
  const manual: any = {};
  const answers = JSON.parse(a.answers_json || '{}');
  for (const q of questions) {
    total += q.marks || 1;
    const given = answers[q.id];
    if (q.type === 'subjective') {
      manual[q.id] = Math.max(0, Math.min(q.marks, Number(scores[q.id]) || 0));
    } else if (q.type === 'objective') {
      const list = JSON.parse(q.accepted_answers || '[]').map((x: string) => String(x).trim().toLowerCase());
      if (list.includes(String(given ?? '').trim().toLowerCase())) autoScore += q.marks;
    } else if (String(given ?? '').toLowerCase() === q.correct) {
      autoScore += q.marks;
    }
  }
  const finalScore = autoScore + Object.values(manual).reduce((s: number, m: any) => s + Number(m), 0);
  await updateDoc(aref, { manual_json: JSON.stringify(manual), graded: 1, score: finalScore });
  return { score: finalScore, total, manual };
}

// ---------- bulk text parser ----------
const hasHindi = (s: string) => /[\u0900-\u097F]/.test(s);
export function parseBulkText(text: string) {
  const lines = String(text).split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length);
  const TOKENS = ['question', 'type', 'option', 'answer', 'solution', 'marks'];
  const items: any[] = [];
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_]+)\s*:\s*(.*)$/);
    if (m && TOKENS.includes(m[1].toLowerCase())) { items.push({ token: m[1].toLowerCase(), value: m[2] }); continue; }
    if (TOKENS.includes(line.toLowerCase())) { items.push({ token: line.toLowerCase(), value: '' }); continue; }
    items.push({ token: null, value: line });
  }
  const questions: any[] = [];
  let cur: any = null; let lastToken: string | null = null; let curOption: any = null;
  const flush = () => { if (cur && (cur.question || (cur._qLines && cur._qLines.length))) questions.push(cur); cur = null; };
  const startQ = () => { flush(); cur = { options: [], _qLines: [], _solLines: [] }; lastToken = null; curOption = null; };
  for (const it of items) {
    if (!cur && !it.token) continue;
    if (it.token === 'question') { startQ(); if (it.value) cur._qLines.push(it.value); lastToken = 'question'; continue; }
    if (!cur) continue;
    if (it.token === 'type') { cur.type = (it.value || '').toLowerCase().trim(); lastToken = 'type'; continue; }
    if (it.token === 'option') { curOption = { text: it.value || '', hi: hasHindi(it.value || '') }; if (curOption.text) cur.options.push(curOption); lastToken = 'option'; continue; }
    if (it.token === 'answer') { cur.answer = it.value || ''; lastToken = 'answer'; continue; }
    if (it.token === 'solution') { if (it.value) cur._solLines.push(it.value); lastToken = 'solution'; continue; }
    if (it.token === 'marks') { cur.marks = parseInt(it.value, 10) || undefined; lastToken = 'marks'; continue; }
    const v = it.value;
    if (lastToken === 'question') cur._qLines.push(v);
    else if (lastToken === 'type') cur.type = v.toLowerCase().trim();
    else if (lastToken === 'option') {
      if (/^(correct|incorrect)$/i.test(v)) { if (curOption) curOption.tag = v.toLowerCase(); }
      else if (curOption && !curOption.text) { curOption.text = v; curOption.hi = hasHindi(v); cur.options.push(curOption); }
      else { curOption = { text: v, hi: hasHindi(v) }; cur.options.push(curOption); }
    }
    else if (lastToken === 'answer') cur.answer = (cur.answer ? cur.answer + ' ' : '') + v;
    else if (lastToken === 'solution') cur._solLines.push(v);
    else if (lastToken === 'marks') cur.marks = parseInt(v, 10) || cur.marks;
  }
  flush();

  const out: any[] = [];
  for (const q of questions) {
    const type = ['multiple_choice', 'true_false', 'integer', 'fill_ups', 'mcq', 'truefalse', 'objective'].includes(q.type) ? q.type : 'multiple_choice';
    const qEnLines = (q._qLines || []).filter((l: string) => !hasHindi(l));
    const qHiLines = (q._qLines || []).filter((l: string) => hasHindi(l));
    const b: any = {
      type: type === 'multiple_choice' || type === 'mcq' ? 'mcq'
        : type === 'true_false' || type === 'truefalse' ? 'truefalse'
        : type === 'integer' || type === 'fill_ups' ? 'objective' : 'mcq',
      question: qEnLines.join('\n') || qHiLines.join('\n') || '',
      questionHi: qHiLines.join('\n') || undefined,
      explanation: (q._solLines || []).filter((l: string) => !hasHindi(l)).join('\n') || undefined,
      explanationHi: (q._solLines || []).filter((l: string) => hasHindi(l)).join('\n') || undefined,
      marks: q.marks || 1,
    };
    if (b.type === 'mcq') {
      const opts = (q.options || []).filter((o: any) => o.text);
      const letters = ['a', 'b', 'c', 'd'];
      opts.slice(0, 4).forEach((o: any, i: number) => {
        b[`option${letters[i].toUpperCase()}`] = o.hi ? undefined : o.text;
        b[`option${letters[i].toUpperCase()}Hi`] = o.hi ? o.text : undefined;
      });
      const ci = opts.findIndex((o: any) => o.tag === 'correct');
      if (ci >= 0) {
        b.correct = letters[Math.min(ci, 3)];
      } else {
        const ans = String(q.answer || '').trim().toLowerCase();
        const ai = opts.findIndex((o: any) => o.text.trim().toLowerCase() === ans);
        b.correct = ai >= 0 ? letters[Math.min(ai, 3)] : 'a';
      }
    } else if (b.type === 'truefalse') {
      b.correct = /^f/i.test(String(q.answer || '').trim()) ? 'b' : 'a';
    } else {
      let raw = String(q.answer || '').trim();
      if (!raw && (q.options || []).length) raw = q.options[0].text;
      const list = raw.split(',').map((s: string) => s.trim()).filter((s: string) => s && !/^range\(/i.test(s));
      b.acceptedAnswers = list.length ? list : [raw];
    }
    out.push(b);
  }
  return out;
}

// ---------- templates ----------
let _templates: any[] | null = null;
export function getTemplates(): any[] {
  if (_templates) return _templates;
  _templates = [
    { id: 1, name: 'Blank Page', description: 'Khali page — khud banao', sections: [], theme: null, thumb: '📄' },
    { id: 2, name: 'Course Landing', description: 'Hero + features + pricing + FAQ', sections: [], theme: null, thumb: '🎓' },
  ];
  return _templates;
}