import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { post, setAccessToken, get } from '../../api/client';

export interface User {
  id: number;
  name: string;
  phone: string;
  role: string;
}

interface AuthState {
  user: User | null;
  status: 'idle' | 'otp-sent' | 'loading' | 'authenticated' | 'error';
  error: string | null;
  devOtp: string | null;
  booted: boolean; // bootstrap (refresh-token auto-login) attempt complete hua?
}

// ---------- original DIY flow: generateOtp → verifyOtp → user/login ----------
export const sendOtp = createAsyncThunk('auth/sendOtp', async (phone: string) =>
  post<{ phone: string; devOtp: string }>('/v1/diy/generateOtp', { phone })
);

export const verifyAndLogin = createAsyncThunk(
  'auth/verifyAndLogin',
  async ({ phone, otp }: { phone: string; otp: string }, { rejectWithValue }) => {
    try {
      await post('/v1/diy/verifyOtp', { phone, otp });
      const data = await post<{ user: User; accessToken: string; refreshToken: string }>('/v1/diy/user/login', { phone });
      return data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Invalid OTP';
      return rejectWithValue(msg);
    }
  }
);

export const bootstrap = createAsyncThunk('auth/bootstrap', async (_, { dispatch }) => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  const { default: axios } = await import('axios');
  const res = await axios.post('/v1/diy/refreshToken', { refreshToken });
  const token = res.data?.data?.accessToken as string | undefined;
  if (!token) return null;
  setAccessToken(token);
  const user = await get<User>('/v1/diy/userDetails');
  dispatch(authSlice.actions.setUser(user));
  return user;
});

const initialState: AuthState = { user: null, status: 'idle', error: null, devOtp: null, booted: false };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (s, a) => {
      s.user = a.payload;
      s.status = 'authenticated';
    },
    logout: (s) => {
      s.user = null;
      s.status = 'idle';
      localStorage.removeItem('refreshToken');
      setAccessToken(null);
    },
  },
    extraReducers: (b) => {
    b.addCase(bootstrap.pending, (s) => { s.status = 'loading'; }) // direct URL load pe Protected redirect race fix
      .addCase(bootstrap.fulfilled, (s) => { s.booted = true; })
      .addCase(bootstrap.rejected, (s) => { s.status = 'idle'; s.booted = true; })
      .addCase(sendOtp.pending, (s) => { s.status = 'loading'; s.error = null; s.devOtp = null; })
      .addCase(sendOtp.fulfilled, (s, a) => {
        s.status = 'otp-sent';
        s.devOtp = (a.payload as any)?.devOtp ?? null;
      })
      .addCase(sendOtp.rejected, (s, a) => { s.status = 'error'; s.error = a.error?.message || 'OTP send fail'; })
      .addCase(verifyAndLogin.pending, (s) => { s.status = 'loading'; s.error = null; })
      .addCase(verifyAndLogin.fulfilled, (s, a) => {
        s.user = a.payload.user;
        s.status = 'authenticated';
        localStorage.setItem('refreshToken', a.payload.refreshToken);
        setAccessToken(a.payload.accessToken);
      })
      .addCase(verifyAndLogin.rejected, (s, a) => { s.status = 'otp-sent'; s.error = (a.payload as string) || a.error?.message || 'Invalid OTP'; });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
