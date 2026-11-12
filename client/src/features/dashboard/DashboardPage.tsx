import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Skeleton, MenuItem, Select, Stack, Chip, Alert,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { get } from '../../api/client';
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
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Aaj ka overview â€” original DIY dashboard stats pattern (landingPage/dashboard API se)
      </Typography>

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



