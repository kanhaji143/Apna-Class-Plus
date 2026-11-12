import { Box, Typography, IconButton, Button, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { setActiveSection, updateSectionProps } from './builderSlice';
import type { BaseSection } from './types';

/** Generic props editor — section type ke hisaab se dynamic form */

function Field({ label, value, onChange, type = 'text' }: {
  label: string; value: any; onChange: (v: any) => void; type?: string;
}) {
  return (
    <TextField
      label={label} value={value ?? ''} type={type} size="small" fullWidth sx={{ mb: 1.5 }}
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
    />
  );
}

function StringListEditor({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" fontWeight={800}>{label}</Typography>
      {(values || []).map((v, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
          <TextField size="small" fullWidth value={v}
            onChange={(e) => { const n = [...values]; n[i] = e.target.value; onChange(n); }} />
          <IconButton size="small" onClick={() => onChange(values.filter((_, k) => k !== i))}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => onChange([...(values || []), ''])}>Add</Button>
    </Box>
  );
}

function ObjectListEditor({ label, items, onChange }: {
  label: string; items: Record<string, any>[]; onChange: (v: Record<string, any>[]) => void;
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" fontWeight={800}>{label}</Typography>
      {(items || []).map((item, i) => (
        <Box key={i} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1, mb: 1 }}>
          {Object.keys(item).map((k) => (
            Array.isArray(item[k])
              ? <StringListEditor key={k} label={k} values={item[k]}
                  onChange={(v) => { const n = [...items]; n[i] = { ...item, [k]: v }; onChange(n); }} />
              : <Field key={k} label={k} value={item[k]} type={typeof item[k] === 'number' ? 'number' : 'text'}
                  onChange={(v) => { const n = [...items]; n[i] = { ...item, [k]: v }; onChange(n); }} />
          ))}
          <Button size="small" color="error" startIcon={<DeleteIcon />}
            onClick={() => onChange(items.filter((_, k) => k !== i))}>
            Remove item
          </Button>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />}
        onClick={() => {
          const blank: Record<string, any> = {};
          const first = (items || [])[0];
          if (first) for (const k of Object.keys(first)) blank[k] = Array.isArray(first[k]) ? [] : typeof first[k] === 'number' ? 0 : '';
          onChange([...(items || []), blank]);
        }}>
        Add item
      </Button>
    </Box>
  );
}

export default function PropsPanel() {
  const dispatch = useDispatch();
  const section: BaseSection | undefined = useSelector(
    (s: RootState) => s.builder.sections.find((x) => x.id === s.builder.activeSectionId)
  );

  if (!section) {
    return <Typography variant="body2" color="text.secondary">Canvas mein koi section select karo — uska props form yahan aayega.</Typography>;
  }

  const setProp = (key: string, value: any) =>
    dispatch(updateSectionProps({ id: section.id, props: { [key]: value } }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={800} color="primary">
          {section.type}
        </Typography>
        <Button size="small" onClick={() => dispatch(setActiveSection(null))}>Deselect</Button>
      </Box>

      {Object.entries(section.props).map(([key, value]) => {
        if (Array.isArray(value)) {
          if (value.every((v) => typeof v === 'string')) {
            return <StringListEditor key={key} label={key} values={value as string[]} onChange={(v) => setProp(key, v)} />;
          }
          return <ObjectListEditor key={key} label={key} items={value as Record<string, any>[]} onChange={(v) => setProp(key, v)} />;
        }
        return <Field key={key} label={key} value={value}
          type={typeof value === 'number' ? 'number' : 'text'}
          onChange={(v) => setProp(key, v)} />;
      })}
    </Box>
  );
}
