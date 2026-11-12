import { useEffect, useState } from 'react';
import { Box, Typography, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl, CircularProgress, Alert } from '@mui/material';
import { get, put, post } from '../../api/client';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

interface U { uid: string; name: string; email: string; role: string; plan: string; trialEnd: string | null; createdAt: any; }

export default function AdminPage() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [users, setUsers] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const isSuper = user?.role === 'superadmin';

  const load = () => {
    setLoading(true);
    get<U[]>('/v3/users').then(setUsers).catch((e: any) => setError(e?.message || 'Load fail')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const changeRole = async (uid: string, role: string) => {
    setBusy(uid);
    try { await put(`/v3/users/${uid}/role`, { role }); load(); }
    catch (e: any) { setError(e?.message || 'Role change fail'); }
    finally { setBusy(null); }
  };
  const extend = async (uid: string) => {
    setBusy(uid);
    try { await post(`/v3/users/${uid}/extend-trial`, {}); load(); }
    catch (e: any) { setError(e?.message || 'Extend fail'); }
    finally { setBusy(null); }
  };

  const daysLeft = (u: U) => {
    if (u.role === 'superadmin') return 'âˆž';
    if (!u.trialEnd) return 'â€”';
    const ms = new Date(u.trialEnd).getTime() - Date.now();
    const d = Math.ceil(ms / (24*60*60*1000));
    return d > 0 ? `${d}d left` : `expired ${Math.abs(d)}d ago`;
  };

  if (user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <Box sx={{ p: 4 }}><Alert severity="error">Admin access required.</Alert></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>ðŸ‘¥ User Management (Admin)</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>Name</b></TableCell>
                <TableCell><b>Email</b></TableCell>
                <TableCell><b>Role</b></TableCell>
                <TableCell><b>Plan</b></TableCell>
                <TableCell><b>Trial</b></TableCell>
                <TableCell><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.uid}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {isSuper ? (
                      <FormControl size="small">
                        <Select value={u.role} onChange={(e) => changeRole(u.uid, e.target.value)} disabled={busy === u.uid}>
                          <MenuItem value="teacher">teacher</MenuItem>
                          <MenuItem value="admin">admin</MenuItem>
                          <MenuItem value="superadmin">superadmin</MenuItem>
                        </Select>
                      </FormControl>
                    ) : <Chip size="small" label={u.role} />}
                  </TableCell>
                  <TableCell><Chip size="small" label={u.plan || 'â€”'} color={u.plan === 'active' ? 'success' : u.plan === 'trial' ? 'info' : 'warning'} /></TableCell>
                  <TableCell>{daysLeft(u)}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => extend(u.uid)} disabled={busy === u.uid || u.role === 'superadmin'}>+7 days</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}


