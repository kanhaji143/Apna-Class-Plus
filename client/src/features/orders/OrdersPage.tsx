import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Paper,
} from '@mui/material';
import { get } from '../../api/client';

interface Order {
  _id: number; courseTitle: string; studentName: string; studentPhone: string;
  amount: number; discount: number; couponCode: string | null;
  status: string; paymentId: string | null; createdAt: any; paidAt: string | null;
}

const fmtDate = (v: any) => {
  if (!v) return '';
  const d = v?.toDate ? v.toDate() : new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN');
};

const STATUS: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  paid: { label: 'Paid', color: 'success' },
  created: { label: 'Pending', color: 'warning' },
  failed: { label: 'Failed', color: 'error' },
};

/** Teacher order list — store se aaye payments (paid/pending/failed). */
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<Order[]>('/v1/diy/orders').then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  const paid = orders.filter((o) => o.status === 'paid');
  const revenue = paid.reduce((s, o) => s + Number(o.amount || 0), 0);
  const pending = orders.filter((o) => o.status === 'created').length;

  return (
    <Box>
      <Typography variant="h5" fontWeight={900} gutterBottom>Orders</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Store se aaye payments — paid, pending aur failed orders.
      </Typography>

      {loading ? (
        <Typography color="text.secondary">Loading orders…</Typography>
      ) : orders.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">Abhi koi order nahi</Typography>
          <Typography variant="body2" color="text.secondary">
            Store enroll par jab student payment kare, order yahan dikhega.
          </Typography>
        </CardContent></Card>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Revenue (paid)</Typography>
                <Typography variant="h4" fontWeight={900}>₹{revenue.toLocaleString('en-IN')}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Paid Orders</Typography>
                <Typography variant="h4" fontWeight={900}>{paid.length}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Pending</Typography>
                <Typography variant="h4" fontWeight={900}>{pending}</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            {orders.map((o) => {
              const st = STATUS[o.status] || STATUS.created;
              return (
                <Grid item xs={12} sm={6} md={4} key={o._id}>
                  <Card elevation={2}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Typography fontWeight={800}>{o.courseTitle}</Typography>
                        <Chip size="small" label={st.label} color={st.color} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        👤 {o.studentName} · {o.studentPhone}
                      </Typography>
                      <Typography variant="h6" fontWeight={900}>
                        ₹{Number(o.amount || 0).toLocaleString('en-IN')}
                        {o.discount > 0 && (
                          <Typography component="span" variant="caption" color="success.main" sx={{ ml: 1 }}>
                            -₹{o.discount}
                          </Typography>
                        )}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        {o.couponCode && <Chip size="small" variant="outlined" label={`🎟 ${o.couponCode}`} />}
                        <Chip size="small" variant="outlined" label={`#${o._id}`} />
                        <Chip size="small" variant="outlined" label={fmtDate(o.paidAt || o.createdAt)} />
                      </Box>
                      {o.paymentId && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, wordBreak: 'break-all' }}>
                          Payment: {o.paymentId}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Box>
  );
}
