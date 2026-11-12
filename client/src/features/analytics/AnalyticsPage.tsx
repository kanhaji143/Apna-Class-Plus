import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, FormControl, InputLabel, Select, MenuItem, CircularProgress, Chip,
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { get } from '../../api/client';

interface AnalyticsData {
  range: string;
  summary: {
    totalLeads: number; totalPageViews: number; totalPages: number; totalCourses: number;
    totalCampaigns: number; conversionRate: string;
  };
  charts: {
    dailyLeads: { day: string; value: number }[];
    dailyViews: { day: string; value: number }[];
    revenue: { day: string; revenue: number }[];
  };
  topPages: { title: string; slug: string; leads: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');

  useEffect(() => {
    setLoading(true);
    get<AnalyticsData>(`/v3/analytics/overview?range=${range}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) {
    return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 300 }}><CircularProgress /></Box>;
  }

  if (!data) {
    return <Typography color="text.secondary">Analytics load nahi hua.</Typography>;
  }

  const { summary, charts, topPages } = data;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={800}>Analytics</Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Range</InputLabel>
          <Select label="Range" value={range} onChange={(e) => setRange(e.target.value)}>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Leads', value: summary.totalLeads, color: '#6C5CE7' },
          { label: 'Page Views', value: summary.totalPageViews, color: '#00CEC9' },
          { label: 'Landing Pages', value: summary.totalPages, color: '#FD79A8' },
          { label: 'Courses', value: summary.totalCourses, color: '#FDCB6E' },
          { label: 'Campaigns', value: summary.totalCampaigns, color: '#E17055' },
          { label: 'Conversion Rate', value: summary.conversionRate, color: '#00B894' },
        ].map((s) => (
          <Grid item xs={6} sm={4} md={2} key={s.label}>
            <Card elevation={3} sx={{ textAlign: 'center', p: 1 }}>
              <CardContent>
                <Typography variant="h4" fontWeight={900} sx={{ color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Daily Leads</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={charts.dailyLeads}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" name="Leads" stroke="#6C5CE7" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Daily Page Views</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={charts.dailyViews}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Views" fill="#00CEC9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top pages */}
      <Card elevation={3} sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Top Landing Pages (by leads)</Typography>
          {topPages.length === 0 ? (
            <Typography color="text.secondary">No data yet.</Typography>
          ) : (
            topPages.map((p, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: i < topPages.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                <Typography>{p.title}</Typography>
                <Chip size="small" label={`${p.leads} leads`} color="primary" />
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
