import { ThemeProvider, createTheme } from '@mui/material/styles';

// Nunito Sans — original Classplus DIY ka font (live-verified)
export const theme = createTheme({
  palette: {
    primary: { main: '#6C5CE7' },
    secondary: { main: '#00CEC9' },
    background: { default: '#F7F8FC' },
  },
  typography: {
    fontFamily: ['"Nunito Sans"', 'system-ui', 'sans-serif'].join(','),
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700 } } },
  },
});

export default ThemeProvider;
