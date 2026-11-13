import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography, Alert, IconButton, Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { post } from '../../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  courseId: number | null;
  courseTitle?: string;
  defaultStudentName?: string;
  initialLink?: string | null;
}

/**
 * Course access link generator — student bina login /learn/<token> pe content dekhta hai.
 * Snapshot Firestore (`courseLinks`) mein jata hai, isliye rules public get allow karte hain.
 */
export default function AccessLinkDialog({ open, onClose, courseId, courseTitle, defaultStudentName, initialLink }: Props) {
  const [studentName, setStudentName] = useState(defaultStudentName || '');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setStudentName(defaultStudentName || ''); setLink(initialLink || ''); setError(null); }
  }, [open, defaultStudentName, initialLink]);

  const generate = async () => {
    if (!courseId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await post<{ url: string }>(`/v2/courses/${courseId}/share`, { studentName: studentName.trim() });
      setLink(window.location.origin + res.url);
    } catch {
      setError('Link generate nahi hua — dobara try karo.');
    } finally { setBusy(false); }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      window.alert('Link copy ho gaya — student ko bhej do:\n' + link);
    } catch {
      window.prompt('Link copy karo:', link);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Course Access</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {courseTitle ? `"${courseTitle}"` : 'Course'} ka access link banao. Student bina login course content dekh sakta hai.
        </Typography>
        <TextField
          label="Student name (optional)"
          helperText="Naam likhoge to page pe 'For <name>' dikhega."
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          fullWidth
        />
        {error && <Alert severity="error">{error}</Alert>}
        {link && (
          <Box>
            <TextField value={link} InputProps={{ readOnly: true }} size="small" fullWidth />
            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
              <Tooltip title="Copy link">
                <IconButton size="small" onClick={copy}><ContentCopyIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Open student view">
                <IconButton size="small" onClick={() => window.open(link, '_blank')}><OpenInNewIcon fontSize="small" /></IconButton>
              </Tooltip>
              <Typography variant="caption" color="text.secondary">
                Link kholte hi content dikhega.
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={generate} disabled={!courseId || busy}>
          {busy ? 'Generating…' : link ? 'New Link' : 'Generate Link'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
