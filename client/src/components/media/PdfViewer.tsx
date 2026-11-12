import { Box, Typography } from '@mui/material';

interface Props { url: string; title?: string; }

export default function PdfViewer({ url, title }: Props) {
  if (!url) return <Typography color="text.secondary">No PDF URL provided.</Typography>;
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <iframe
        src={url}
        title={title || 'PDF'}
        style={{ width: '100%', height: 600, border: 0 }}
      />
    </Box>
  );
}
