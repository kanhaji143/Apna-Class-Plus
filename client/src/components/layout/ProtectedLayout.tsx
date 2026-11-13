import { Fragment, useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemText, Typography, AppBar, Toolbar,
  Button, Divider, Tooltip, Paper, Chip, IconButton, useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useDispatch, useSelector } from 'react-redux';
import { get } from '../../api/client';
import { logout } from '../../features/auth/authSlice';
import type { RootState } from '../../app/store';

const DRAWER_W = 240;

/** Original DIY pattern (live-verified): sidebar /v1/diy/configuration/tabs se aata hai */
interface TabItem {
  icon: string; activeIcon: string; title: string; slug: string;
  order: number; subMenu?: { title: string; slug: string }[];
  isAddOnEnabled: number; addOnKey?: string;
}

export default function ProtectedLayout() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    get<TabItem[]>('/v1/diy/configuration/tabs').then(setTabs).catch(() => setTabs([]));
  }, []);

  if (!user) return null;

  const go = (slug: string) => {
    setMobileOpen(false);
    navigate('/' + slug);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{ width: DRAWER_W, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_W } }}
      >
        <Toolbar sx={{ px: 2 }}>
          <Typography variant="h6" color="primary" fontWeight={900}>Apna Class Plus</Typography>
        </Toolbar>
        <Divider />
        <List sx={{ flex: 1 }}>
          {tabs.map((t) => (
            <Fragment key={t.slug + t.order}>
              <ListItemButton onClick={() => go(t.slug)} sx={{ borderRadius: 2, mx: 1 }}>
                <ListItemText
                  primary={t.title}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                  secondary={t.subMenu?.map((s) => s.title).join(' Â· ')}
                  secondaryTypographyProps={{ fontSize: 11, noWrap: true }}
                />
              </ListItemButton>
              {t.subMenu && t.subMenu.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 2, pb: 1 }}>
                  {t.subMenu.map((s) => (
                    <Chip key={s.slug} label={s.title} size="small"
                      sx={{ cursor: 'pointer', fontSize: 11 }}
                      onClick={() => go(s.slug)} />
                  ))}
                </Box>
              )}
            </Fragment>
          ))}
          <ListItemButton onClick={() => { setMobileOpen(false); window.open('/store', '_blank'); }} sx={{ borderRadius: 2, mx: 1 }}>
            <ListItemText primary="🛍️ My Store (public)" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
          </ListItemButton>
          {(user.role === 'admin' || user.role === 'superadmin') && (
            <ListItemButton onClick={() => go('/admin')} sx={{ borderRadius: 2, mx: 1 }}>
              <ListItemText primary="Admin (Users & Trials)" primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
            </ListItemButton>
          )}
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar position="sticky" color="inherit" elevation={1} sx={{ bgcolor: 'white' }}>
          <Toolbar sx={{ gap: 1 }}>
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)} size="small" sx={{ mr: 0.5 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Paper sx={{ px: 2, py: 0.5, mr: 1, bgcolor: 'primary.lighter', maxWidth: { xs: 150, sm: 'none' } }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {user.name} Â· {user.role}
              </Typography>
            </Paper>
            <Tooltip title="Logout">
              <Button variant="outlined" color="primary" onClick={() => { dispatch(logout()); navigate('/login'); }} size={isMobile ? 'small' : 'medium'}>
                Logout
              </Button>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ p: { xs: 1.5, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

