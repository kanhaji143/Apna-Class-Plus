/**
 * Firebase core (Phase 13 — Spark plan live migration, core-first)
 * - FB_MODE: runtimeConfig.FIREBASE_MODE===true pe on (hosted build) — warna local server flow
 * - Firestore collections numeric ids use karte hain (pages code unchanged) — counters/{name} doc
 * - Users: Firebase Auth (email/password) + users/{uid} profile doc
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, runTransaction, collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, type Firestore, writeBatch } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

export const runConfig = (window as any).runConfig || {};

const firebaseConfig = {
  apiKey: 'AIzaSyBiPnMYXL92iPQF8br0qV6UmBV1o14qBl8',
  authDomain: 'apna-class-plus.firebaseapp.com',
  projectId: 'apna-class-plus',
  storageBucket: 'apna-class-plus.firebasestorage.app',
  messagingSenderId: '1075213820803',
  appId: '1:1075213820803:web:09c7687f4831c7f38dccb6',
};

export const FB_MODE: boolean = runConfig.FIREBASE_MODE === true;

let app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

if (FB_MODE) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  _db = getFirestore(app);
  _auth = getAuth(app);
}

export const db = () => _db as Firestore;
export const auth = () => _auth as Auth;

// ---------- numeric auto-increment ids (pages code unchanged chalta hai) ----------
export async function nextId(dbv: Firestore, name: string): Promise<number> {
  const ref = doc(dbv, 'counters', name);
  const nid = await runTransaction(dbv, async (tx) => {
    const snap = await tx.get(ref);
    const cur = (snap.data()?.n as number) || 0;
    tx.set(ref, { n: cur + 1 }, { merge: true });
    return cur + 1;
  });
  return nid;
}

// ---------- helpers ----------
export const tsNow = () => serverTimestamp();

export async function qGet<T = any>(col: string, opts: {
  wheres?: Array<[string, string, any]>;
  orderField?: string;
  orderDir?: 'asc' | 'desc';
  limit?: number;
}): Promise<T[]> {
  const dbv = db();
  let q = collection(dbv, col) as any;
  const parts: any[] = [];
  for (const [f, op, v] of opts.wheres || []) parts.push(where(f, op as any, v));
  if (opts.orderField) parts.push(orderBy(opts.orderField, opts.orderDir || 'desc'));
  if (opts.limit) parts.push((await import('firebase/firestore')).limit(opts.limit));
  if (parts.length) q = query(q, ...parts);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as object), id: Number(d.id) || d.id })) as unknown as T[];
}

export { doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, orderBy, getDocs, writeBatch, runTransaction };
