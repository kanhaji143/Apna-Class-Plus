import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography, Grid } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { get, post } from '../../api/client';

interface Template { id: string; name: string; description: string; ctaText: string; }

export default function TemplateGalleryPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    get<Template[]>('/v1/diy/templatePages').then(setTemplates).catch(() => setTemplates([]));
  }, []);

  const choose = async (tpl: Template) => {
    if (tpl.id === 'course') {
      navigate('/landing-pages/create/course'); // wizard: course select
    } else {
      // direct create → editor
      const page = await post<{ _id: number }>('/v1/diy/landingPages', { templateId: tpl.id, title: tpl.name });
      navigate(`/landing-pages/edit/${page._id}`);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/landing-pages/list')}>Back</Button>
        <Typography variant="h5" fontWeight={800}>Create your Landing Page</Typography>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Alag-alag usecase ke liye template choose karo (original DIY jaisa)
      </Typography>

      <Grid container spacing={3}>
        {templates.map((t) => (
          <Grid item xs={12} md={4} key={t.id}>
            <Card elevation={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" fontWeight={800} gutterBottom>{t.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t.description}</Typography>
              </CardContent>
              <CardContent>
                <Button variant="contained" fullWidth onClick={() => choose(t)}>{t.ctaText}</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
