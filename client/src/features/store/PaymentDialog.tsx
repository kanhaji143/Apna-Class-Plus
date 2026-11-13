import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Alert, CircularProgress, Divider,
} from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  order: { id: number; amount: number; courseTitle?: string } | null;
  onSuccess: (paymentId: string) => void;
}

/**
 * Checkout — Razorpay Checkout.js (real keys hone par) ya Test Mode mock gateway
 * (placeholder key `rzp_test_XXXX...` hone par). Spark plan mein verification ke liye
 * backend/webhook nahi hai — real integration mein teacher manually verify karega.
 */
const RAZORPAY_KEY = ((window as any).runConfig?.RAZORPAY_KEY || '') as string;
const IS_MOCK = !RAZORPAY_KEY || RAZORPAY_KEY.includes('XXXX') || RAZORPAY_KEY.startsWith('rzp_test_XXXXXXXX');

declare global {
  interface Window { Razorpay?: any }
}

export default function PaymentDialog({ open, onClose, order, onSuccess }: Props) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'fail'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setStatus('idle'); setError(null); }
  }, [open]);

  const amount = order?.amount || 0;
  const paise = Math.round(amount * 100);

  const loadRazorpay = (): Promise<boolean> => new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const startReal = async () => {
    setStatus('processing');
    setError(null);
    const ok = await loadRazorpay();
    if (!ok) {
      setStatus('fail');
      setError('Razorpay checkout load nahi hua — internet check karo.');
      return;
    }
    try {
      const rzp = new (window as any).Razorpay({
        key: RAZORPAY_KEY,
        amount: paise,
        currency: 'INR',
        name: 'Apna Class Plus',
        description: order?.courseTitle || 'Course enrollment',
        handler: (response: any) => {
          onSuccess(response?.razorpay_payment_id || 'rzp_pay_' + Date.now());
        },
        modal: { ondismiss: () => setStatus('idle') },
        theme: { color: '#6C5CE7' },
      });
      rzp.open();
    } catch {
      setStatus('fail');
      setError('Checkout open nahi hua.');
    }
  };

  const mockSuccess = async () => {
    setStatus('processing');
    await new Promise((r) => setTimeout(r, 1200));
    onSuccess('mock_pay_' + Date.now());
  };

  const mockFail = async () => {
    setStatus('processing');
    await new Promise((r) => setTimeout(r, 700));
    setStatus('fail');
    setError('Payment failed (simulated) — dobara try karo.');
  };

  return (
    <Dialog open={open} onClose={status === 'processing' ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Checkout</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">Course</Typography>
          <Typography variant="body2" fontWeight={800} sx={{ textAlign: 'right' }}>{order?.courseTitle}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">Order ID</Typography>
          <Typography variant="body2" fontWeight={700}>#{order?.id}</Typography>
        </Box>
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={800}>Total</Typography>
          <Typography variant="h5" fontWeight={900} color="primary">₹{amount}</Typography>
        </Box>

        {IS_MOCK && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <b>Test Mode</b> — Razorpay test keys configured nahi hain. Ye simulated payment hai,
            real charge nahi hoga. Keys mile to <code>runConfig.RAZORPAY_KEY</code> set karke real checkout enable hota hai.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {status === 'processing' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Payment process ho raha hai…</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        {IS_MOCK ? (
          <>
            <Button onClick={mockFail} disabled={status === 'processing'} color="error" variant="outlined">
              Simulate Fail
            </Button>
            <Button onClick={mockSuccess} disabled={status === 'processing'} variant="contained">
              {status === 'processing' ? 'Processing…' : `Simulate Pay ₹${amount}`}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} disabled={status === 'processing'}>Cancel</Button>
            <Button onClick={startReal} disabled={status === 'processing'} variant="contained">
              {status === 'processing' ? 'Opening…' : `Pay ₹${amount}`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
