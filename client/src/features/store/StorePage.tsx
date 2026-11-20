import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, Tab, Tabs, Avatar, Paper, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PaymentDialog from './PaymentDialog';

const FB = (window as any).runConfig?.FIREBASE_MODE === true;

const pubGet = async (path: string) => {
  if (FB) {
    const { route } = await import('../../firebase/fbRouter');
    return route('GET', path);
  }
  const r = await axios.get(path);
  return r.data.data;
};

const pubPost = async <T = any>(path: string, body: any): Promise<T> => {
  if (FB) {
    const { route } = await import('../../firebase/fbRouter');
    return route('POST', path, body) as Promise<T>;
  }
  const r = await axios.post(path, body);
  return r.data.data as T;
};

interface StoreCourse { id: number; title: string; description: string | null; price: number; currency: string; ownerUid?: string; }
interface StoreTest { id: number; title: string; description: string | null; durationMin: number; questionCount: number; }
interface StoreMaterial { id: number; type: string; title: string; url: string | null; description: string | null; category?: string; }
interface StoreFaculty { id: number; name: string; subject: string; bio: string; experience: string; }
interface StorePost { id: number; title: string; body: string; type: string; createdAt?: any; }

export default function StorePage() {
  const [teacherName, setTeacherName] = useState('Apna Class Plus');
  const [courses, setCourses] = useState<StoreCourse[]>([]);
  const [tests, setTests] = useState<StoreTest[]>([]);
  const [materials, setMaterials] = useState<StoreMaterial[]>([]);
  const [faculty, setFaculty] = useState<StoreFaculty[]>([]);
  const [posts, setPosts] = useState<StorePost[]>([]);
  const [dailyQuiz, setDailyQuiz] = useState<StoreTest | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  const [enrollCourse, setEnrollCourse] = useState<StoreCourse | null>(null);
  const [enrollForm, setEnrollForm] = useState({ name: '', phone: '', coupon: '' });
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [couponInfo, setCouponInfo] = useState<any | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [order, setOrder] = useState<{ id: number; amount: number; courseTitle?: string } | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    pubGet('/store').then((d: any) => {
      setTeacherName(d.teacherName || 'Apna Class Plus');
      setCourses(d.courses || []);
      setTests(d.tests || []);
      setMaterials(d.materials || []);
      setFaculty(d.faculty || []);
      setDailyQuiz(d.dailyQuiz || null);
      setPosts(d.posts || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const match = (s?: string) => !q || (s || '').toLowerCase().includes(q);
  const filteredCourses = courses.filter((c) => match(c.title) || match(c.description || ''));
  const filteredTests = tests.filter((t) => match(t.title) || match(t.description || ''));
  const categories = Array.from(new Set(materials.map((m) => m.category).filter(Boolean))) as string[];
  const filteredMaterials = materials.filter((m) => match(m.title) || match(m.description || '') || match(m.category || ''));
  const shownMaterials = category ? filteredMaterials.filter((m) => m.category === category) : filteredMaterials;

  const openEnroll = (c: StoreCourse) => {
    setEnrollCourse(c);
    setEnrollForm({ name: '', phone: '', coupon: '' });
    setCouponInfo(null);
    setCouponMsg(null);
    setOrder(null);
    setPayOpen(false);
    setEnrolled(false);
  };

  const applyCoupon = async () => {
    const code = enrollForm.coupon.trim();
    if (!code || !enrollCourse) return;
    setCouponBusy(true);
    setCouponMsg(null);
    try {
      const r = await pubPost('/v1/diy/coupons/apply', { code, courseId: enrollCourse.id, price: enrollCourse.price });
      setCouponInfo(r);
    } catch (e: any) {
      setCouponInfo(null);
      setCouponMsg(e?.message || 'Invalid coupon');
    } finally { setCouponBusy(false); }
  };

  const directEnroll = async () => {
    if (!enrollCourse || !enrollForm.name.trim() || !enrollForm.phone.trim()) return;
    setEnrolling(true);
    try {
      await pubPost('/v1/diy/leads', {
        ownerUid: enrollCourse.ownerUid || 'public',
        courseId: enrollCourse.id,
        courseTitle: enrollCourse.title,
        name: enrollForm.name,
        phone: enrollForm.phone,
        couponCode: couponInfo?.code || (enrollForm.coupon.trim() || undefined),
        source: 'store',
      });
      setEnrolled(true);
    } catch {
      setEnrolled(false);
    } finally {
      setEnrolling(false);
    }
  };

  const submitEnroll = async () => {
    if (!enrollCourse || !enrollForm.name.trim() || !enrollForm.phone.trim()) return;
    const amount = couponInfo?.finalPrice ?? enrollCourse.price;
    if (!amount || amount <= 0) { await directEnroll(); return; } // free course
    setEnrolling(true);
    try {
      const o = await pubPost<{ id: number; amount: number }>('/v1/diy/orders', {
        ownerUid: enrollCourse.ownerUid || 'public',
        courseId: enrollCourse.id,
        courseTitle: enrollCourse.title,
        studentName: enrollForm.name,
        studentPhone: enrollForm.phone,
        amount,
        discount: couponInfo?.discount || 0,
        couponCode: couponInfo?.code || undefined,
      });
      setOrder({ id: o.id, amount: o.amount, courseTitle: enrollCourse.title });
      setPayOpen(true);
    } catch {
      setEnrolled(false);
    } finally {
      setEnrolling(false);
    }
  };

  const onPaymentSuccess = async (paymentId: string) => {
    setPayOpen(false);
    try {
      await pubPost('/v1/diy/orders/' + order!.id + '/complete', { paymentId });
      setEnrolled(true);
    } catch {
      setEnrolled(false);
      window.alert('Payment complete record nahi hua — teacher se contact karo.');
    }
  };

  const price = (c: StoreCourse) =>
    !c.price ? 'FREE' : `${c.currency === 'INR' ? '₹' : c.currency + ' '}${c.price.toLocaleString('en-IN')}`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FC' }}>
      {/* Hero header */}
      <Box sx={{ background: 'linear-gradient(135deg,#6C5CE7 0%,#8E7CF8 100%)', color: '#fff', py: 4, px: 2, textAlign: 'center' }}>
        <Avatar sx={{ width: 72, height: 72, mx: 'auto', bgcolor: '#fff', color: '#6C5CE7', fontSize: 32, fontWeight: 900, mb: 1 }}>
          {teacherName[0]?.toUpperCase()}
        </Avatar>
        <Typography variant="h5" fontWeight={900}>{teacherName}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>Learn. Practice. Grow. 🚀</Typography>
        <Button size="small" variant="outlined" href="/tools/bmi" sx={{ mt: 1.5, color: '#fff', borderColor: '#fff', fontWeight: 800 }}>
          🧮 BMI Calculator
        </Button>
      </Box>

      {/* Search + Tabs */}
      <Paper elevation={0} sx={{ position: 'sticky', top: 0, zIndex: 5, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ px: 2, pt: 1.5 }}>
          <TextField
            size="small" fullWidth placeholder="🔍 Courses, tests, material खोजें…"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab label={`📚 Courses (${courses.length})`} />
          <Tab label={`📝 Tests (${tests.length})`} />
          <Tab label={`🎁 Free Material (${materials.length})`} />
          <Tab label={`👨‍🏫 Faculty (${faculty.length})`} />
          <Tab label={`📰 Blog & News (${posts.length})`} />
        </Tabs>
      </Paper>

      <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
        {loading ? (
          <>{[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={110} sx={{ mb: 2, borderRadius: 3 }} />)}</>
        ) : tab === 0 ? (
          <>
            {dailyQuiz && (
              <Card elevation={3} sx={{ mb: 2, borderRadius: 3, background: 'linear-gradient(135deg,#6C5CE7,#8E7CF8)', color: '#fff' }}>
                <CardContent>
                  <Typography fontWeight={900}>⚡ आज का क्विज़</Typography>
                  <Typography sx={{ opacity: 0.95, mb: 1 }}>{dailyQuiz.title} · {dailyQuiz.questionCount} प्रश्न</Typography>
                  <Button size="small" variant="contained" onClick={() => navigate(`/test/${dailyQuiz.id}`)} sx={{ bgcolor: '#fff', color: '#6C5CE7', fontWeight: 800 }}>
                    Start →
                  </Button>
                </CardContent>
              </Card>
            )}
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>📚 Courses</Typography>
            {filteredCourses.length === 0 && (
              <Card><CardContent><Typography color="text.secondary" textAlign="center" py={3}>Abhi koi course publish nahi hai.</Typography></CardContent></Card>
            )}
            {filteredCourses.map((c) => (
              <Card key={c.id} elevation={2} sx={{ mb: 2, borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                    <Typography fontWeight={800} fontSize={17}>{c.title}</Typography>
                    {c.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{c.description}</Typography>}
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Chip size="small" label={price(c)} color={c.price ? 'primary' : 'success'} sx={{ fontWeight: 800 }} />
                      {c.price > 0 && <Chip size="small" variant="outlined" label="Enroll karke access lo" />}
                    </Box>
                  </Box>
                  <Button variant="contained" color="primary" onClick={() => openEnroll(c)} sx={{ fontWeight: 800, borderRadius: 2, px: 3 }}>
                    Enroll →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </>
        ) : tab === 1 ? (
          <>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>📝 Practice Tests</Typography>
            {filteredTests.length === 0 && (
              <Card><CardContent><Typography color="text.secondary" textAlign="center" py={3}>Abhi koi test published nahi.</Typography></CardContent></Card>
            )}
            {filteredTests.map((t) => (
              <Card key={t.id} elevation={2} sx={{ mb: 2, borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                    <Typography fontWeight={800} fontSize={16}>{t.title}</Typography>
                    {t.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{t.description}</Typography>}
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" label={`⏱ ${t.durationMin} min`} />
                      <Chip size="small" label={`📝 ${t.questionCount} questions`} />
                      <Chip size="small" color="success" label="FREE" />
                    </Box>
                  </Box>
                  <Button variant="contained" color="primary" onClick={() => navigate(`/test/${t.id}`)} sx={{ fontWeight: 800, borderRadius: 2, px: 3 }}>
                    Start Test →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </>
        ) : tab === 2 ? (
          <>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>🎁 Free Study Material</Typography>
            {categories.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip size="small" label="Sab" variant={category === '' ? 'filled' : 'outlined'} onClick={() => setCategory('')} />
                {categories.map((c) => (
                  <Chip key={c} size="small" label={c} variant={category === c ? 'filled' : 'outlined'} onClick={() => setCategory(c)} />
                ))}
              </Box>
            )}
            {shownMaterials.length === 0 && (
              <Card><CardContent><Typography color="text.secondary" textAlign="center">Abhi koi material published nahi.</Typography></CardContent></Card>
            )}
            {shownMaterials.map((m) => (
              <Card key={m.id} elevation={2} sx={{ mb: 2, borderRadius: 3 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ fontSize: 32 }}>
                    {m.type === 'pdf' ? '📄' : m.type === 'youtube' ? '▶️' : '🎬'}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                    <Typography fontWeight={800} fontSize={16}>{m.title}</Typography>
                    {m.description && <Typography variant="body2" color="text.secondary">{m.description}</Typography>}
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Chip size="small" color="success" label="FREE" />
                      {m.category && <Chip size="small" variant="outlined" label={m.category} />}
                    </Box>
                  </Box>
                  {m.url && (
                    <Button variant="contained" color="primary" href={m.url} target="_blank" sx={{ fontWeight: 800, borderRadius: 2, px: 3 }}>
                      Get →
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        ) : tab === 3 ? (
          <>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>👨‍🏫 Faculty</Typography>
            {faculty.length === 0 && (
              <Card><CardContent><Typography color="text.secondary" textAlign="center" py={3}>Abhi koi faculty profile nahi hai.</Typography></CardContent></Card>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 2 }}>
              {faculty.map((f) => (
                <Card key={f.id} elevation={2} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 900 }}>{f.name?.[0] || '?'}</Avatar>
                      <Box>
                        <Typography fontWeight={800}>{f.name}</Typography>
                        <Typography variant="caption" color="primary">{f.subject}</Typography>
                      </Box>
                    </Box>
                    {f.experience && <Typography variant="caption" color="text.secondary" display="block">{f.experience}</Typography>}
                    {f.bio && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{f.bio}</Typography>}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        ) : (
          <>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>📰 Blog & News</Typography>
            {posts.length === 0 && (
              <Card><CardContent><Typography color="text.secondary" textAlign="center" py={3}>Abhi koi post nahi hai.</Typography></CardContent></Card>
            )}
            {posts.map((p) => (
              <Card key={p.id} elevation={2} sx={{ mb: 2, borderRadius: 3 }}>
                <CardContent>
                  <Typography fontWeight={800} fontSize={17}>{p.type === 'short' ? '🎬' : p.type === 'news' ? '📰' : '📝'} {p.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {p.body?.slice(0, 300)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </Box>

      {/* Enroll dialog — payments Phase 5 pending, so lead capture */}
      <Dialog open={!!enrollCourse} onClose={() => setEnrollCourse(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Enroll: {enrollCourse?.title}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {enrolled ? (
            <Alert severity="success">
              Enrolled! 🎉 Teacher aapko jaldi contact karega.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Apna naam aur phone number chhodo — teacher aapko course access ke liye contact karega.
              </Typography>
              <TextField label="Aapka naam" value={enrollForm.name} onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })} fullWidth autoFocus />
              <TextField label="Phone number" type="tel" value={enrollForm.phone} onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })} fullWidth />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField label="Coupon code (optional)" value={enrollForm.coupon}
                  onChange={(e) => setEnrollForm({ ...enrollForm, coupon: e.target.value })} fullWidth size="small" />
                <Button variant="outlined" onClick={applyCoupon} disabled={couponBusy || !enrollForm.coupon.trim()} sx={{ mt: 0.5 }}>
                  {couponBusy ? '…' : 'Apply'}
                </Button>
              </Box>
              {couponMsg && <Typography variant="caption" color="error">{couponMsg}</Typography>}
              {couponInfo?.valid && (
                <Alert severity="success" sx={{ py: 0 }}>
                  ✅ {couponInfo.code} applied — {couponInfo.discountType === 'flat' ? `₹${couponInfo.discount}` : `${couponInfo.value}%`} off.
                  {enrollCourse && enrollCourse.price > 0 && (
                    <> Price: <s>₹{enrollCourse.price}</s> → <b>₹{couponInfo.finalPrice}</b></>
                  )}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {enrolled ? (
            <Button variant="contained" onClick={() => setEnrollCourse(null)}>Done</Button>
          ) : (
            <>
              <Button onClick={() => setEnrollCourse(null)}>Cancel</Button>
              <Button variant="contained" disabled={!enrollForm.name.trim() || !enrollForm.phone.trim() || enrolling} onClick={submitEnroll}>
                {enrolling ? 'Sending…' : 'Enroll'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <PaymentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        order={order}
        onSuccess={onPaymentSuccess}
      />
    </Box>
  );
}
