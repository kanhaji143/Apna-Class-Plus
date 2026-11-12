import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { get, post, put } from '../../api/client';
import { DEFAULT_THEME, defaultSection, type BaseSection, type SectionType, type Theme } from './types';

export interface BuilderState {
  pageId: number | null;
  title: string;
  slug: string | null;
  status: 'draft' | 'published';
  sections: BaseSection[];
  theme: Theme;
  activeSectionId: string | null;
  past: BaseSection[][];
  future: BaseSection[][];
  dirty: boolean;
}

const initialState: BuilderState = {
  pageId: null, title: '', slug: null, status: 'draft',
  sections: [], theme: DEFAULT_THEME, activeSectionId: null,
  past: [], future: [], dirty: false,
};

// ---------- thunks (API) ----------
export const fetchPage = createAsyncThunk('builder/fetchPage', async (id: number) => {
  return get<{ _id: number; title: string; slug: string | null; status: string; sections: BaseSection[]; theme: Theme }>(`/v1/diy/landingPages/${id}`);
});

export const savePage = createAsyncThunk('builder/savePage', async (_: void, { getState }) => {
  const st = (getState() as any).builder as BuilderState;
  await put('/v1/diy/section/form', { pageId: st.pageId, sections: st.sections, theme: st.theme, title: st.title });
  return true;
});

export const publishPage = createAsyncThunk('builder/publishPage', async (_: void, { getState, dispatch }) => {
  const st = (getState() as any).builder as BuilderState;
  dispatch(savePage() as any); // pehle save
  return post<{ publicUrl: string; slug: string; status: string }>(`/v1/diy/landingPages/${st.pageId}/publish`);
});

// ---------- history helper ----------
const HISTORY_LIMIT = 50;
function withHistory(state: BuilderState, newSections: BaseSection[]) {
  state.past = [...state.past.slice(-HISTORY_LIMIT), state.sections];
  state.future = [];
  state.sections = newSections;
  state.dirty = true;
}

const builderSlice = createSlice({
  name: 'builder',
  initialState,
  reducers: {
    resetBuilder: () => initialState,
    setActiveSection: (s, a: PayloadAction<string | null>) => { s.activeSectionId = a.payload; },
    setTitle: (s, a: PayloadAction<string>) => { s.title = a.payload; s.dirty = true; },
    addSection: (s, a: PayloadAction<SectionType>) => {
      withHistory(s, [...s.sections, defaultSection(a.payload)]);
      s.activeSectionId = s.sections[s.sections.length - 1].id;
    },
    removeSection: (s, a: PayloadAction<string>) => {
      withHistory(s, s.sections.filter((x) => x.id !== a.payload));
      if (s.activeSectionId === a.payload) s.activeSectionId = null;
    },
    reorderSections: (s, a: PayloadAction<{ from: number; to: number }>) => {
      const arr = [...s.sections];
      const [moved] = arr.splice(a.payload.from, 1);
      arr.splice(a.payload.to, 0, moved);
      withHistory(s, arr);
    },
    updateSectionProps: (s, a: PayloadAction<{ id: string; props: Record<string, any> }>) => {
      withHistory(s, s.sections.map((x) => (x.id === a.payload.id ? { ...x, props: { ...x.props, ...a.payload.props } } : x)));
    },
    updateTheme: (s, a: PayloadAction<Theme>) => { s.theme = a.payload; s.dirty = true; },
    undo: (s) => {
      if (!s.past.length) return;
      const prev = s.past[s.past.length - 1];
      s.past = s.past.slice(0, -1);
      s.future = [s.sections, ...s.future];
      s.sections = prev;
      s.dirty = true;
    },
    redo: (s) => {
      if (!s.future.length) return;
      const next = s.future[0];
      s.future = s.future.slice(1);
      s.past = [...s.past, s.sections];
      s.sections = next;
      s.dirty = true;
    },
    markSaved: (s) => { s.dirty = false; },
  },
  extraReducers: (b) => {
    b.addCase(fetchPage.fulfilled, (s, a) => {
      s.pageId = a.payload._id;
      s.title = a.payload.title;
      s.slug = a.payload.slug;
      s.status = (a.payload.status as any) || 'draft';
      s.sections = a.payload.sections || [];
      s.theme = a.payload.theme?.colors ? a.payload.theme : DEFAULT_THEME;
      s.past = []; s.future = []; s.dirty = false;
      s.activeSectionId = null;
    })
      .addCase(savePage.fulfilled, (s) => { s.dirty = false; })
      .addCase(publishPage.fulfilled, (s, a) => {
        s.slug = a.payload.slug;
        s.status = 'published';
        s.dirty = false;
      });
  },
});

export const {
  resetBuilder, setActiveSection, setTitle, addSection, removeSection,
  reorderSections, updateSectionProps, updateTheme, undo, redo, markSaved,
} = builderSlice.actions;
export default builderSlice.reducer;
