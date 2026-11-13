import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography, IconButton, Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface Props {
  open: boolean;
  onClose: () => void;
  studentName?: string;
  learnLink?: string;
  chatLink?: string;
}

/** Lead convert ke baad student ke liye onboarding links (learning + chat). */
export default function OnboardingDialog({ open, onClose, studentName, learnLink, chatLink }: Props) {
  const rows: { label: string; icon: string; url: string; hint: string }[] = [];
  if (learnLink) rows.push({ label: 'Course Access Link', icon: '📚', url: learnLink, hint: 'Student bina login course padhega' });
  if (chatLink) rows.push({ label: 'Chat Link', icon: '💬', url: chatLink, hint: 'Student seedha aapse baat karega' });

  if (!rows.length) return null;

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      window.alert('Link copy ho gaya:\n' + url);
    } catch {
      window.prompt('Link copy karo:', url);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Student Onboarding Links</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {studentName && (
          <Typography variant="body2" color="text.secondary">
            👤 <b>{studentName}</b> ke liye — in links ko student ko bhej do.
          </Typography>
        )}
        {rows.map((r) => (
          <Box key={r.label}>
            <Typography variant="body2" fontWeight={800}>{r.icon} {r.label}</Typography>
            <TextField value={r.url} InputProps={{ readOnly: true }} size="small" fullWidth sx={{ mt: 0.5 }} />
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
              <Tooltip title="Copy link">
                <IconButton size="small" onClick={() => copy(r.url)}><ContentCopyIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Open">
                <IconButton size="small" onClick={() => window.open(r.url, '_blank')}><OpenInNewIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Typography variant="caption" color="text.secondary">{r.hint}</Typography>
            </Box>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
