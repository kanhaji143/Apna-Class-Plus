import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { store } from './app/store';
import ThemeProvider, { theme } from './app/theme';

// Nunito Sans — original DIY font
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;900&family=Nunito+Sans:wght@300;400;600;700;900&display=swap';
document.head.appendChild(link);

// Service worker — PWA offline shell (optional, best-effort)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
