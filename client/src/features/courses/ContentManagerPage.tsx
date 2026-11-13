import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, Chip, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { get, post, del } from '../../api/client';

interface Content { id: number; course_id: number; folder_id: number | null; type: string; title: string; url: string; description: string; duration: number; sort_order: number; }
interface Folder { id: number; course_id: number; parent_id: number | null; name: string; sort_order: number; }

const CONTENT_TYPES = [
  { value: 'video', label: 'Video', icon: '🎬' },
  { value: 'pdf', label: 'PDF', icon: '📄' },
  { value: 'live', label: 'Live Class', icon: '🔴' },
  { value: 'test', label: 'Test', icon: '📝' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
];

function typeIcon(type: string) { return CONTENT_TYPES.find((t) => t.value === type)?.icon ?? '📎'; }

function SortableContent({ c, onDelete }: { c: Content; onDelete: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1, p: 1, mb: 0.5, borderRadius: 1, flexWrap: 'wrap',
        border: '1px solid', borderColor: 'divider', bgcolor: isDragging ? 'grey.200' : '#fff',
        transform: CSS.Transform.toString(transform), transition,
      }}
    >
      <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab' }}>
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
      <Typography>{typeIcon(c.type)}</Typography>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2" fontWeight={700}>{c.title}</Typography>
        {c.url && <Typography variant="caption" color="text.secondary" noWrap>{c.url}</Typography>}
      </Box>
      <Chip size="small" label={c.type} variant="outlined" />
      <IconButton size="small" onClick={() => onDelete(c.id)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export default function ContentManagerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'video', title: '', url: '', description: '' });
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => {
    get<{ title: string }>(`/v2/courses/${id}`).then((c) => setCourseTitle(c.title)).catch(() => {});
    get<{ contents: Content[]; folders: Folder[] }>(`/v2/course/content/get?courseId=${id}`)
      .then((d) => { setContents(d.contents); setFolders(d.folders); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const addContent = async () => {
    setCreating(true);
    try {
      await post('/v2/course/content/add', { courseId: Number(id), ...form });
      setOpen(false); setForm({ type: 'video', title: '', url: '', description: '' });
      load();
    } finally { setCreating(false); }
  };

  const addFolder = async () => {
    if (!folderName.trim()) return;
    setCreating(true);
    try {
      await post('/v2/course/folder/add', { courseId: Number(id), name: folderName });
      setFolderOpen(false); setFolderName('');
      load();
    } finally { setCreating(false); }
  };

  const deleteContent = async (cid: number) => {
    if (!confirm('Content delete karna hai?')) return;
    await del(`/v2/course/content/delete/${cid}`);
    load();
  };

  const onDragEnd = async (e: any) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = contents.findIndex((c) => c.id === active.id);
    const to = contents.findIndex((c) => c.id === over.id);
    if (from < 0 || to < 0) return;
    const arr = [...contents];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setContents(arr);
    // persist
    const items = arr.map((c, i) => ({ id: c.id, order: i + 1 }));
    await post('/v2/course/reorder/contents', items).catch(() => {});
  };

  // group contents by folder
  const rootContents = contents.filter((c) => !c.folder_id);
  const folderContents = (fid: number) => contents.filter((c) => c.folder_id === fid);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/courses')}>Back</Button>
        <Typography variant="h5" fontWeight={800}>{courseTitle || 'Course'} — Content Manager</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setFolderOpen(true)}>New Folder</Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add Content</Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading content…</Typography>
      ) : (
        <>
          {/* Root (ungrouped) contents */}
          <Card elevation={2} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Course Content ({contents.length} items)</Typography>
              <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={rootContents.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {rootContents.map((c) => (
                    <SortableContent key={c.id} c={c} onDelete={deleteContent} />
                  ))}
                </SortableContext>
              </DndContext>
              {rootContents.length === 0 && <Typography variant="body2" color="text.secondary">No content yet. Add some!</Typography>}
            </CardContent>
          </Card>

          {/* Folders */}
          {folders.map((f) => (
            <Accordion key={f.id} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={700}>📁 {f.name} ({folderContents(f.id).length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {folderContents(f.id).map((c) => (
                  <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, mb: 0.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
                    <Typography>{typeIcon(c.type)}</Typography>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight={700}>{c.title}</Typography>
                      {c.url && <Typography variant="caption" color="text.secondary" noWrap>{c.url}</Typography>}
                    </Box>
                    <Chip size="small" label={c.type} variant="outlined" />
                    <IconButton size="small" onClick={() => deleteContent(c.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                {folderContents(f.id).length === 0 && <Typography variant="body2" color="text.secondary">Empty folder</Typography>}
              </AccordionDetails>
            </Accordion>
          ))}
        </>
      )}

      {/* Add Content Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Content</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {CONTENT_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.icon} {t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
          <TextField label="URL (video/pdf link)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} fullWidth />
          <TextField label="Description (optional)" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.title || creating} onClick={addContent}>
            {creating ? 'Adding…' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={folderOpen} onClose={() => setFolderOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Folder</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField label="Folder name" value={folderName} onChange={(e) => setFolderName(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFolderOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!folderName.trim() || creating} onClick={addFolder}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
