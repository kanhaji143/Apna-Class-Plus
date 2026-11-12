import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Stack, TextField, Typography, Alert, CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { sendOtp, verifyAndLogin, fbSignIn } from './authSlice';
import type { RootState } from '../../app/store';

const FB_MODE = (window as any).runConfig?.FIREBASE_MODE === true;

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  // Firebase mode: email/password (+ signup mode with naam)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const status = useSelector((s: RootState) => s.auth.status);
  const error = useSelector((s: RootState) => s.auth.error);
  const devOtp = useSelector((s: RootState) => s.auth.devOtp);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSendOtp = () => {
    if (/^\d{10}$/.test(phone)) dispatch(sendOtp(phone) as any);
  };

  const onVerify = async () => {
    try {
      await dispatch(verifyAndLogin({ phone, otp }) as any).unwrap();
      navigate('/', { replace: true });
    } catch {
      /* slice handles error state */
    }
  };

  const onFbSubmit = async () => {
    if (!email.trim() || password.length < 6) return;
    try {
      await dispatch(fbSignIn({ email: email.trim(), password, name, signup: isSignup }) as any).unwrap();
      navigate('/', { replace: true });
    } catch {
      /* slice handles error state */
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ maxWidth: 400, width: '100%', boxShadow: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" color="primary" gutterBottom>
            Apna Class Plus
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {FB_MODE ? 'Email/password se login ya signup karo' : 'Teacher dashboard mein login karo (OTP flow — original DIY jaisa)'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {FB_MODE ? (
            <Stack spacing={2}>
              {isSignup && (
                <TextField label="Aapka naam" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              )}
              <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
              <TextField label="Password (min 6)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
              {status === 'loading' ? (
                <CircularProgress size={28} sx={{ alignSelf: 'center' }} />
              ) : (
                <Button variant="contained" size="large" fullWidth onClick={onFbSubmit} disabled={!email.trim() || password.length < 6}>
                  {isSignup ? 'Create Account' : 'Login'}
                </Button>
              )}
              <Button size="small" onClick={() => setIsSignup(!isSignup)} sx={{ alignSelf: 'center' }}>
                {isSignup ? 'Pehle se account hai? Login karo' : 'Naya teacher ho? Signup karo'}
              </Button>
            </Stack>
          ) : (
          <Stack spacing={2}>
            <TextField
              label="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              fullWidth
              inputProps={{ inputMode: 'numeric' }}
              disabled={status === 'otp-sent' || status === 'loading'}
            />

            {status === 'otp-sent' && (
              <>
                {devOtp && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <b>Dev mode OTP:</b> {devOtp} (server console mein bhi print hua hai)
                  </Alert>
                )}
                <TextField
                  label="OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  fullWidth
                  inputProps={{ inputMode: 'numeric' }}
                />
              </>
            )}

            {status === 'loading' ? (
              <CircularProgress size={28} sx={{ alignSelf: 'center' }} />
            ) : status === 'otp-sent' ? (
              <Button variant="contained" size="large" fullWidth onClick={onVerify}>
                Verify & Login
              </Button>
            ) : (
              <Button
                variant="contained" size="large" fullWidth onClick={onSendOtp}
                disabled={!/^\d{10}$/.test(phone)}
              >
                Send OTP
              </Button>
            )}
          </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
