import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, MenuItem, TextField, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { get, post } from '../../api/client';

interface Course { id: number; title: string; price: string; description: string; }

export default function WizardCoursePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    get<{ data: Course[] }>('/v2/courses?offset=0&limit=20').then((d) => setCourses(d.data)).catch(() => setCourses([]));
  }, []);

  const next = async () => {
    if (courseId === '') { setError('Pehle course select karo'); return; }
    setCreating(true);
    try {
      const page = await post<{ _id: number }>('/v1/diy/landingPages', {
        templateId: 'course',
        title: courses.find((c) => c.id === courseId)?.title || 'Course Page',
        courseId,
      });
      navigate(`/landing-pages/edit/${page._id}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Page create fail hua');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/landing-pages/create')}>Previous</Button>
        <Typography variant="h5" fontWeight={800}>Create Course Promotion Page</Typography>
      </Box>

      <Card elevation={4}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Select Course to be promoted</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            select label="Course" value={courseId} onChange={(e) => setCourseId(Number(e.target.value))}
            fullWidth sx={{ mb: 3 }}
          >
            {courses.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.title} {c.price !== 'Free' ? `(${c.price})` : '(Free)'}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => navigate('/landing-pages/create')}>Previous</Button>
            <Button variant="contained" disabled={courseId === '' || creating} onClick={next}>
              {creating ? 'Creating…' : 'Next'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
