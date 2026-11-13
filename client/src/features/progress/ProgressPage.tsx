import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, LinearProgress, Paper,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { get } from '../../api/client';

interface LinkProgress {
  token: string; courseId: number; courseTitle: string; studentName: string;
  total: number; done: number; pct: number; createdAt: string;
}

const fmtDate = (v: string) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN');
};

/** Teacher view — student-wise course completion (courseLinks.progress). */
export default function ProgressPage() {
  const [links, setLinks] = useState<LinkProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<LinkProgress[]>('/v2/course-links').then(setLinks).catch(() => setLinks([])).finally(() => setLoading(false));
  }, []);

  const avg = links.length ? Math.round(links.reduce((n, l) => n + l.pct, 0) / links.length) : 0;
  const completed = links.filter((l) => l.total > 0 && l.pct === 100).length;

  return (
    <Box>
      <Typography variant="h5" fontWeight={900} gutterBottom>Student Progress</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Course access links — student kitne lessons complete kar chuka hai.
      </Typography>

      {loading ? (
        <Typography color="text.secondary">Loading progress…</Typography>
      ) : links.length === 0 ? (
        <Card><CardContent>
          <Typography variant="h6">Abhi koi access link nahi</Typography>
          <Typography variant="body2" color="text.secondary">
            Courses page se course ka share link banao — student us link se padhega aur progress yahan dikhega.
          </Typography>
        </CardContent></Card>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Shared Links</Typography>
                <Typography variant="h4" fontWeight={900}>{links.length}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Average Completion</Typography>
                <Typography variant="h4" fontWeight={900}>{avg}%</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">Completed (100%)</Typography>
                <Typography variant="h4" fontWeight={900}>{completed}</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            {links.map((l) => (
              <Grid item xs={12} key={l.token}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ flexGrow: 1, minWidth: 220 }}>
                        <Typography fontWeight={800}>{l.courseTitle}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                          {l.studentName
                            ? <Chip size="small" color="primary" variant="outlined" label={`👤 ${l.studentName}`} />
                            : <Chip size="small" variant="outlined" label="General link" />}
                          <Chip size="small" variant="outlined" label={`${l.done}/${l.total} lessons`} />
                          {l.total === 0 && <Chip size="small" label="No content" />}
                          {fmtDate(l.createdAt) && <Chip size="small" variant="outlined" label={fmtDate(l.createdAt)} />}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5 }}>
                          <LinearProgress
                            variant="determinate" value={l.pct}
                            sx={{ flexGrow: 1, height: 8, borderRadius: 1, bgcolor: 'grey.200' }}
                          />
                          <Typography variant="caption" fontWeight={800}>{l.pct}%</Typography>
                        </Box>
                      </Box>
                      <Button
                        size="small" variant="outlined" endIcon={<OpenInNewIcon />}
                        onClick={() => window.open(`/learn/${l.token}`, '_blank')}
                      >
                        Open
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
