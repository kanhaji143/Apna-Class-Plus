import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Skeleton, MenuItem, Select, Stack, Chip, Alert, Button,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { get, post } from '../../api/client';
import type { RootState } from '../../app/store';

interface DashboardStats {
  landingPageCount: number;
  publishedCourseCount: number;
  couponCount: number;
  campaignCount: number;
}

interface AnalyticsCard {
  id: number; points: number; text: string; percent: string; flag: number; subtext: string;
}

export default function DashboardPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(7);
  const [analytics, setAnalytics] = useState<AnalyticsCard[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const storeUrl = `${window.location.origin}/store`;
  const copyStore = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = storeUrl; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    get<DashboardStats>('/v1/diy/landingPage/dashboard')
      .then(setStats)
      .catch(() => setStats({ landingPageCount: 0, publishedCourseCount: 0, couponCount: 0, campaignCount: 0 }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setAnalyticsLoading(true);
    get<{ data: AnalyticsCard[] }>('/v1/diy/analytcs/stats?day=' + day)
      .then((d) => setAnalytics(d.data))
      .catch(() => setAnalytics([]))
      .finally(() => setAnalyticsLoading(false));
  }, [day]);

  const seedDemo = async () => {
    setSeeding(true);
    setSeedMsg(null);
    try {
      const r = await post<any>('/v1/diy/seed-demo', {});
      const created = Object.entries(r).filter(([, v]) => v).map(([k]) => k);
      setSeedMsg(created.length ? `✅ Seeded: ${created.join(', ')}` : '✅ Demo data pehle se mojood hai.');
    } catch (e: any) {
      setSeedMsg('❌ Seed fail: ' + (e?.message || 'error'));
    } finally { setSeeding(false); }
  };

  const cards = [
    { label: 'Landing Pages', value: stats?.landingPageCount },
    { label: 'Published Courses', value: stats?.publishedCourseCount },
    { label: 'Coupons', value: stats?.couponCount },
    { label: 'Campaigns', value: stats?.campaignCount },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Namaste, {user?.name} ðŸ‘‹</Typography>
      {user?.role !== 'superadmin' && user?.trialEnd && (() => {
        const ms = new Date(user.trialEnd).getTime() - Date.now();
        const days = Math.ceil(ms / (24*60*60*1000));
        const expired = days <= 0;
        return (
          <Alert severity={expired ? 'warning' : 'info'} sx={{ mb: 2 }}>
            {expired
              ? `âš ï¸ Aapka 7-day trial expire ho gaya hai. Upgrade ke liye admin se contact karo.`
              : `ðŸŽ Trial: ${days} din baaki hain (expire: ${new Date(user.trialEnd).toLocaleDateString()}).`}
          </Alert>
        );
      })()}
      <Card elevation={3} sx={{ mb: 3, background: 'linear-gradient(135deg,#6C5CE7 0%,#8E7CF8 100%)', color: '#fff' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={900}>🛍️ My Student Store</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Apne students ko ye link bhejo — wo bina login ke courses, tests aur free material dekh sakte hain.
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontFamily: 'monospace', wordBreak: 'break-all' }}>{storeUrl}</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={copyStore} sx={{ bgcolor: '#fff', color: '#6C5CE7', fontWeight: 800, '&:hover': { bgcolor: '#f1efff' } }}>
                {copied ? '✓ Copied!' : 'Copy Link'}
              </Button>
              <Button variant="outlined" href="/store" target="_blank" sx={{ color: '#fff', borderColor: '#fff', fontWeight: 800 }}>
                Open
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography color="text.secondary">
          Aaj ka overview â€” original DIY dashboard stats pattern (landingPage/dashboard API se)
        </Typography>
        <Button variant="outlined" onClick={seedDemo} disabled={seeding}>
          {seeding ? 'Seeding…' : '🌱 Seed Demo Data'}
        </Button>
      </Box>
      {seedMsg && <Alert severity="info" sx={{ mb: 2 }}>{seedMsg}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} md={3} key={c.label}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                {loading ? <Skeleton width={40} height={40} /> : (
                  <Typography variant="h3" color="primary" fontWeight={900}>{c.value}</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card elevation={3}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={800}>Analytics</Typography>
            <Select size="small" value={day} onChange={(e) => setDay(Number(e.target.value))}>
              {[{ v: 1, t: 'Today' }, { v: 7, t: 'Last 7 Days' }, { v: 15, t: 'Last 15 Days' }, { v: 30, t: 'Last 30 Days' }]
                .map((o) => <MenuItem key={o.v} value={o.v}>{o.t}</MenuItem>)}
            </Select>
          </Stack>
          <Grid container spacing={2}>
            {analyticsLoading ? (
              [1, 2, 3, 4].map((i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rounded" height={90} />
                </Grid>
              ))
            ) : (
              analytics.map((a) => (
                <Grid item xs={12} sm={6} md={3} key={a.id}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">{a.text}</Typography>
                    <Typography variant="h4" fontWeight={900}>{a.points}</Typography>
                    <Chip
                      size="small"
                      label={a.percent + ' ' + (a.flag === 0 ? 'â†“' : 'â†‘')}
                      color={a.flag === 0 ? 'error' : 'success'}
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                      {a.subtext}
                    </Typography>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}



