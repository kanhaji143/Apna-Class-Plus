import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid, Chip, Paper,
} from '@mui/material';
import { FB_MODE } from '../../firebase/fb';

/**
 * PUBLIC BMI + Body Fat calculator tool (`/tools/bmi`).
 * Free utility widget — store page se link hota hai.
 */
export default function BmiPage() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [result, setResult] = useState<null | { bmi: number; cat: string; color: string; bf: number | null; healthy: [number, number]; bmr: number }>(null);

  const calc = () => {
    const h = Number(height) / 100;
    const w = Number(weight);
    const a = Number(age) || 25;
    if (!h || !w) return;
    const bmi = w / (h * h);
    const bf = Math.max(2, 1.20 * bmi + 0.23 * a - 10.8 * (gender === 'male' ? 1 : 0) - 5.4);
    const bmr = 10 * w + 6.25 * Number(height) - 5 * a + (gender === 'male' ? 5 : -161);
    const healthy: [number, number] = [Math.round(18.5 * h * h), Math.round(24.9 * h * h)];
    let cat = 'Normal', color = 'success';
    if (bmi < 18.5) { cat = 'Underweight'; color = 'info'; }
    else if (bmi < 25) { cat = 'Normal'; color = 'success'; }
    else if (bmi < 30) { cat = 'Overweight'; color = 'warning'; }
    else { cat = 'Obese'; color = 'error'; }
    setResult({ bmi, cat, color, bf, healthy, bmr });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FC', p: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Typography variant="h4" fontWeight={900} gutterBottom>🧮 BMI & Body Fat Calculator</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Apna Class Plus free health tool — height/weight daalo, BMI aur body fat estimate paao.
        </Typography>

        <Card elevation={3} sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Height (cm)" type="number" value={height} onChange={(e) => setHeight(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Weight (kg)" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip label="Male" variant={gender === 'male' ? 'filled' : 'outlined'} onClick={() => setGender('male')} />
                  <Chip label="Female" variant={gender === 'female' ? 'filled' : 'outlined'} onClick={() => setGender('female')} />
                </Box>
              </Grid>
            </Grid>
            <Button variant="contained" size="large" fullWidth sx={{ mt: 2, fontWeight: 800 }} onClick={calc} disabled={!height || !weight}>
              Calculate
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h2" fontWeight={900} color={`${result.color}.main`}>{result.bmi.toFixed(1)}</Typography>
                <Chip label={result.cat} color={result.color as any} />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Body Fat (est.)</Typography>
                    <Typography variant="h5" fontWeight={900}>{(result.bf ?? 0).toFixed(1)}%</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Healthy Weight</Typography>
                    <Typography variant="h5" fontWeight={900}>{result.healthy[0]}–{result.healthy[1]} kg</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">BMR (kcal/day)</Typography>
                    <Typography variant="h5" fontWeight={900}>{Math.round(result.bmr)}</Typography>
                  </Paper>
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                Ye estimate hai — doctor se salah zaroor lo.
              </Typography>
            </CardContent>
          </Card>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 4 }}>
          {FB_MODE ? 'Powered by Apna Class Plus' : 'Apna Class Plus — Free Tools'}
        </Typography>
      </Box>
    </Box>
  );
}
