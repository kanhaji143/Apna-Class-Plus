import { useEffect, useState } from 'react';
import {
  Box, Button, Typography, IconButton, Tab, Tabs, Alert, Snackbar,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  DndContext, closestCenter, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import type { RootState } from '../../app/store';
import {
  fetchPage, savePage, publishPage, addSection, removeSection, reorderSections,
  setActiveSection, setTitle, undo, redo, updateTheme as updateThemeAction,
  updateSectionProps,
} from './builderSlice';
import { SECTION_LIBRARY, type BaseSection, type SectionType } from './types';
import { renderPageHTML } from './renderPageHTML';
import PropsPanel from './PropsPanel';

/** Canvas card for one section (drag handle + preview + delete) */
function SortableSection({ section, index }: { section: BaseSection; index: number }) {
  const dispatch = useDispatch();
  const active = useSelector((s: RootState) => s.builder.activeSectionId === section.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  return (
    <Box
      ref={setNodeRef}
      onClick={() => dispatch(setActiveSection(section.id))}
      sx={{
        mb: 2, border: 2, borderRadius: 2, borderColor: active ? 'primary.main' : 'divider',
        bgcolor: '#fff', cursor: 'pointer', overflow: 'hidden',
        transform: CSS.Transform.toString(transform), transition,
        opacity: isDragging ? 0.6 : 1, boxShadow: active ? 4 : 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, bgcolor: active ? 'primary.light' : 'grey.100' }}>
        <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab' }}>
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" fontWeight={800} sx={{ flexGrow: 1 }}>
          {index + 1}. {SECTION_LIBRARY.find((l) => l.type === section.type)?.label ?? section.type}
        </Typography>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); dispatch(removeSection(section.id)); }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ maxHeight: 140, overflow: 'hidden', pointerEvents: 'none' }}>
        <SectionThumb section={section} />
      </Box>
    </Box>
  );
}

/** chhota visual preview (canvas ke liye) */
function SectionThumb({ section }: { section: BaseSection }) {
  const p = section.props || {};
  switch (section.type) {
    case 'HERO':
      return <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: '#fff' }}>
        <Typography fontWeight={900}>{p.headline}</Typography>
        <Typography variant="caption">{p.subheadline}</Typography>
      </Box>;
    case 'BANNER_STRIP':
      return <Box sx={{ p: 1, bgcolor: 'primary.main', color: '#fff' }}><Typography variant="caption" noWrap>{p.text}</Typography></Box>;
    case 'FEATURES':
      return <Box sx={{ display: 'flex', gap: 1, p: 2, justifyContent: 'center' }}>
        {(p.items || []).map((i: any, k: number) => <Typography key={k} variant="caption" sx={{ mx: 1 }}>{i.icon} {i.title}</Typography>)}
      </Box>;
    case 'TESTIMONIALS':
      return <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption">❝ {(p.items || [])[0]?.quote} ❞</Typography>
      </Box>;
    case 'PRICING':
      return <Box sx={{ display: 'flex', gap: 1, p: 2, justifyContent: 'center' }}>
        {(p.plans || []).map((pl: any, k: number) => <Typography key={k} variant="caption" sx={{ mx: 1, fontWeight: 800 }}>{pl.name}: ₹{pl.price}</Typography>)}
      </Box>;
    case 'FAQ':
      return <Box sx={{ p: 2 }}>
        {(p.items || []).slice(0, 2).map((i: any, k: number) => <Typography key={k} variant="caption" display="block">❓ {i.q}</Typography>)}
      </Box>;
    case 'VIDEO':
      return <Box sx={{ p: 2, textAlign: 'center' }}><Typography variant="caption">🎬 {p.title}</Typography></Box>;
    case 'FOOTER':
      return <Box sx={{ p: 2, bgcolor: '#222', color: '#aaa', textAlign: 'center' }}><Typography variant="caption">{p.contact}</Typography></Box>;
    default:
      return null;
  }
}

export default function BuilderEditorPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const builder = useSelector((s: RootState) => s.builder);
  const [tab, setTab] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchPage(Number(id)) as any);
  }, [id]); // eslint-disable-line

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const from = builder.sections.findIndex((s) => s.id === active.id);
      const to = builder.sections.findIndex((s) => s.id === over.id);
      dispatch(reorderSections({ from, to }));
    }
  };

  const onSave = async () => {
    setSaving(true);
    try { await dispatch(savePage() as any).unwrap(); setToast('✅ Saved (draft)'); } catch { setToast('❌ Save fail'); }
    finally { setSaving(false); }
  };

  const onPublish = async () => {
    try {
      const res = await dispatch(publishPage() as any).unwrap();
      setToast('🚀 Published! URL: ' + res.publicUrl);
    } catch { setToast('❌ Publish fail'); }
  };

  const previewHTML = renderPageHTML(builder.sections, builder.theme, builder.slug || 'preview');

  return (
    <Box>
      {/* ---- topbar ---- */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/landing-pages/list')}>Back</Button>
        <Box component="input"
          value={builder.title}
          onChange={(e) => dispatch(setTitle((e.target as HTMLInputElement).value))}
          sx={{ border: 0, outline: 0, fontSize: 22, fontWeight: 800, fontFamily: 'inherit', minWidth: 200 }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={() => dispatch(undo())} disabled={!builder.past.length}><UndoIcon /></IconButton>
        <IconButton onClick={() => dispatch(redo())} disabled={!builder.future.length}><RedoIcon /></IconButton>
        <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={() => setPreviewOpen(true)}>Preview</Button>
        <Button variant="outlined" startIcon={<SaveIcon />} onClick={onSave} disabled={saving || !builder.dirty}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="contained" startIcon={<RocketLaunchIcon />} onClick={onPublish}>Publish</Button>
      </Box>
      {builder.slug && builder.status === 'published' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Published at: <b>/lp-preview/{builder.slug}</b>
        </Alert>
      )}

      {/* ---- 3 columns ---- */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '210px 1fr 300px' }, gap: 2 }}>
        {/* left: section library */}
        <Box>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>SECTION LIBRARY</Typography>
          {SECTION_LIBRARY.map((l) => (
            <Box key={l.type} onClick={() => dispatch(addSection(l.type as SectionType))}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, p: 1, mb: 0.5, borderRadius: 1,
                border: '1px dashed', borderColor: 'divider', cursor: 'pointer',
                '&:hover': { bgcolor: 'primary.light', borderColor: 'primary.main' },
              }}>
              <Typography>{l.icon}</Typography>
              <Typography variant="body2" fontWeight={700}>+ {l.label}</Typography>
            </Box>
          ))}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Click karke section add karo · canvas mein ⠿ se drag-drop reorder karo
          </Typography>
        </Box>

        {/* center: canvas */}
        <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2, minHeight: 400 }}>
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={builder.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {builder.sections.map((s, i) => <SortableSection key={s.id} section={s} index={i} />)}
              {builder.sections.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.secondary">Left se sections add karo 👈</Typography>
                </Box>
              )}
            </SortableContext>
          </DndContext>
        </Box>

        {/* right: props / theme */}
        <Box>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Props" />
            <Tab label="Theme" />
          </Tabs>
          <Box sx={{ mt: 1 }}>
            {tab === 0
              ? <PropsPanel />
              : <ThemePanel theme={builder.theme} onChange={(t) => dispatch(updateThemeAction(t))} />}
          </Box>
        </Box>
      </Box>

      {/* ---- preview modal (iframe — CSS isolated, original pattern) ---- */}
      {previewOpen && (
        <Box onClick={() => setPreviewOpen(false)}
          sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,.6)', zIndex: 1300, display: 'grid', placeItems: 'center', p: 2 }}>
          <Box onClick={(e) => e.stopPropagation()} sx={{ width: '100%', maxWidth: 900, height: '85vh', bgcolor: '#fff', borderRadius: 2, overflow: 'hidden' }}>
            <iframe title="preview" srcDoc={previewHTML} style={{ width: '100%', height: '100%', border: 0 }} />
          </Box>
        </Box>
      )}

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} message={toast ?? ''} />
    </Box>
  );
}

/** Theme panel — colors + font + radius */
function ThemePanel({ theme, onChange }: { theme: import('./types').Theme; onChange: (t: import('./types').Theme) => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="body2" fontWeight={700}>Primary color</Typography>
        <input type="color" value={theme.colors.primary}
          onChange={(e) => onChange({ ...theme, colors: { ...theme.colors, primary: e.target.value } })}
          style={{ width: '100%', height: 40, border: 0, borderRadius: 8, cursor: 'pointer' }} />
      </Box>
      <Box>
        <Typography variant="body2" fontWeight={700}>Background</Typography>
        <input type="color" value={theme.colors.bg}
          onChange={(e) => onChange({ ...theme, colors: { ...theme.colors, bg: e.target.value } })}
          style={{ width: '100%', height: 40, border: 0, borderRadius: 8, cursor: 'pointer' }} />
      </Box>
      <Box>
        <Typography variant="body2" fontWeight={700}>Font</Typography>
        <Box component="select" value={theme.font}
          onChange={(e) => onChange({ ...theme, font: (e.target as HTMLSelectElement).value })}
          sx={{ width: '100%', p: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider', fontFamily: 'inherit' }}>
          {['Nunito Sans', 'Roboto', 'Inter', 'Georgia'].map((f) => <Box component="option" key={f} value={f}>{f}</Box>)}
        </Box>
      </Box>
      <Box>
        <Typography variant="body2" fontWeight={700}>Corner radius: {theme.radius}px</Typography>
        <input type="range" min={0} max={24} value={theme.radius}
          onChange={(e) => onChange({ ...theme, radius: Number(e.target.value) })} style={{ width: '100%' }} />
      </Box>
    </Box>
  );
}

export { updateSectionProps };
