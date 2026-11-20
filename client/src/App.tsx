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
import LearnPage from './features/courses/LearnPage';
import BatchesListPage from './features/batches/BatchesListPage';
import BatchStudentsPage from './features/batches/BatchStudentsPage';
import PeopleListPage from './features/people/PeopleListPage';
import ChatPage from './features/chat/ChatPage';
import PublicChatPage from './features/chat/PublicChatPage';
import CampaignsListPage from './features/campaigns/CampaignsListPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import ProgressPage from './features/progress/ProgressPage';
import CouponsPage from './features/coupons/CouponsPage';
import FacultyPage from './features/faculty/FacultyPage';
import BmiPage from './features/tools/BmiPage';
import ReferralsPage from './features/referrals/ReferralsPage';
import BlogNewsPage from './features/blog/BlogNewsPage';
import SurveyPage from './features/surveys/SurveyPage';
import PublicSurveyPage from './features/surveys/PublicSurveyPage';
import OrdersPage from './features/orders/OrdersPage';
import TestPortalPage from './features/tests/TestPortalPage';
import TestEditorPage from './features/tests/TestEditorPage';
import TestTakePage from './features/tests/TestTakePage';
import FreeMaterialPage from './features/freeMaterial/FreeMaterialPage';
import PublicFreeMaterialsPage from './features/freeMaterial/PublicFreeMaterialsPage';
import AdminPage from './features/admin/AdminPage';
import StorePage from './features/store/StorePage';
import { fbBootstrap } from './features/auth/authSlice';

function Protected({ children }: { children: React.ReactNode }) {
  const user = useSelector((s: RootState) => s.auth.user);
  const booted = useSelector((s: RootState) => s.auth.booted);
  // bootstrap (refresh-token auto-login) attempt complete hone tak loader â€” warna
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
    if (user) return;
    // FB_MODE: Firebase Auth bootstrap; warna refresh-token flow (original pattern)
    if ((window as any).runConfig?.FIREBASE_MODE === true) dispatch(fbBootstrap() as any);
    else dispatch(bootstrap() as any);
  }, []); // eslint-disable-line

  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- public routes ---------- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lp-preview/:slug" element={<LpPreviewPage />} />
        <Route path="/test/:id" element={<TestTakePage />} />
        <Route path="/free/:teacherId" element={<PublicFreeMaterialsPage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/store/:teacherId" element={<StorePage />} />
        <Route path="/chat/:token" element={<PublicChatPage />} />
        <Route path="/learn/:token" element={<LearnPage />} />
        <Route path="/tools/bmi" element={<BmiPage />} />
        <Route path="/survey/:id" element={<PublicSurveyPage />} />

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
          <Route path="progress" element={<ProgressPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="faculty" element={<FacultyPage />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="blog" element={<BlogNewsPage />} />
          <Route path="surveys" element={<SurveyPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="content/test-portal" element={<TestPortalPage />} />
          <Route path="content/test-portal/:id" element={<TestEditorPage />} />
          <Route path="content/free-material" element={<FreeMaterialPage />} />
          <Route path="admin" element={<AdminPage />} />
          {/* Phase 4+: courses, batches, chat yahan lazy-load honge */}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

