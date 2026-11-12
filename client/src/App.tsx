import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from './app/store';
import { bootstrap } from './features/auth/authSlice';
import { useDispatch } from 'react-redux';
import LoginPage from './features/auth/LoginPage';
import ProtectedLayout from './components/layout/ProtectedLayout';
import DashboardPage from './features/dashboard/DashboardPage';
import LandingPagesListPage from './features/builder/LandingPagesListPage';
import TemplateGalleryPage from './features/builder/TemplateGalleryPage';
import WizardCoursePage from './features/builder/WizardCoursePage';
import BuilderEditorPage from './features/builder/BuilderEditorPage';
import LpPreviewPage from './features/builder/LpPreviewPage';
import CoursesListPage from './features/courses/CoursesListPage';
import ContentManagerPage from './features/courses/ContentManagerPage';
import BatchesListPage from './features/batches/BatchesListPage';
import BatchStudentsPage from './features/batches/BatchStudentsPage';
import PeopleListPage from './features/people/PeopleListPage';
import ChatPage from './features/chat/ChatPage';
import CampaignsListPage from './features/campaigns/CampaignsListPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import TestPortalPage from './features/tests/TestPortalPage';
import TestEditorPage from './features/tests/TestEditorPage';
import TestTakePage from './features/tests/TestTakePage';
import FreeMaterialPage from './features/freeMaterial/FreeMaterialPage';
import PublicFreeMaterialsPage from './features/freeMaterial/PublicFreeMaterialsPage';

function Protected({ children }: { children: React.ReactNode }) {
  const user = useSelector((s: RootState) => s.auth.user);
  const booted = useSelector((s: RootState) => s.auth.booted);
  // bootstrap (refresh-token auto-login) attempt complete hone tak loader — warna
  // pehla render (user=null) turant /login pe redirect kar deta hai (race fix)
  if (!user && !booted) {
    return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);

  useEffect(() => {
    if (!user) dispatch(bootstrap() as any); // refresh token se auto-login (original pattern)
  }, []); // eslint-disable-line

  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- public routes ---------- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lp-preview/:slug" element={<LpPreviewPage />} />
        <Route path="/test/:id" element={<TestTakePage />} />
        <Route path="/free/:teacherId" element={<PublicFreeMaterialsPage />} />

        {/* ---------- protected (teacher dashboard) ---------- */}
        <Route
          path="/"
          element={
            <Protected>
              <ProtectedLayout />
            </Protected>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="landing-pages/list" element={<LandingPagesListPage />} />
          <Route path="landing-pages/create" element={<TemplateGalleryPage />} />
          <Route path="landing-pages/create/course" element={<WizardCoursePage />} />
          <Route path="landing-pages/edit/:id" element={<BuilderEditorPage />} />
          <Route path="courses" element={<CoursesListPage />} />
          <Route path="courses/:id/content" element={<ContentManagerPage />} />
          <Route path="batches" element={<BatchesListPage />} />
          <Route path="batches/:id/students" element={<BatchStudentsPage />} />
          <Route path="people" element={<PeopleListPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="campaigns" element={<CampaignsListPage />} />
          <Route path="analytics/sales-traffic" element={<AnalyticsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="content/test-portal" element={<TestPortalPage />} />
          <Route path="content/test-portal/:id" element={<TestEditorPage />} />
          <Route path="content/free-material" element={<FreeMaterialPage />} />
          {/* Phase 4+: courses, batches, chat yahan lazy-load honge */}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
