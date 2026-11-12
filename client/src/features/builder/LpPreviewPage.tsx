import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { get } from '../../api/client';
import type { BaseSection, Theme } from './types';
import { renderPageHTML } from './renderPageHTML';
import { DEFAULT_THEME } from './types';

/**
 * PUBLIC landing page — student-facing.
 * Iframe + srcDoc se CSS isolation (original DIY ka Shadow-DOM pattern ka simple version).
 * Lead form renderPageHTML ke andar hai jo /v1/diy/leads pe POST karta hai.
 */
export default function LpPreviewPage() {
  const { slug } = useParams();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    get<{ title: string; sections: BaseSection[]; theme: Theme }>(`/lp/api/${slug}`)
      .then((d) => setHtml(renderPageHTML(d.sections || [], d.theme?.colors ? d.theme : DEFAULT_THEME, slug)))
      .catch((e: any) => setError(e?.response?.data?.message || 'Page load fail hua'));
  }, [slug]);

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4">😕</Typography>
          <Typography>{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <iframe
      title={'landing-' + slug}
      srcDoc={html ?? '<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:60px">Loading…</body></html>'}
      style={{ width: '100%', height: '100vh', border: 0, display: 'block' }}
    />
  );
}
