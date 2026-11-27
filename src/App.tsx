import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkeletonCard } from './components/lucian/SkeletonCard';
import { AppProvider } from './context/AppContext';
import { LandingPage } from './pages/LandingPage';

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const LearnPage = lazy(() =>
  import('./pages/LearnPage').then((m) => ({ default: m.LearnPage }))
);
const PeHubPage = lazy(() =>
  import('./pages/PeHubPage').then((m) => ({ default: m.PeHubPage }))
);
const CodeStudioPage = lazy(() =>
  import('./pages/CodeStudioPage').then((m) => ({ default: m.CodeStudioPage }))
);
const NotesHubPage = lazy(() =>
  import('./pages/NotesHubPage').then((m) => ({ default: m.NotesHubPage }))
);
const MockExamPage = lazy(() =>
  import('./pages/MockExamPage').then((m) => ({ default: m.MockExamPage }))
);

function RouteLoader() {
  return <SkeletonCard variant="route" />;
}

function NotFoundPage() {
  return (
    <div className="mx-auto my-12 max-w-lg rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
      <h1 className="text-xl font-bold text-[var(--text-primary)]">Không tìm thấy trang (404)</h1>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        to="/dashboard"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
      >
        Về Dashboard JavaBrew
      </Link>
    </div>
  );
}

export function AppRoutes() {
  const navigate = useNavigate();
  return (
    <ErrorBoundary onGoHome={() => navigate('/dashboard')}>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pro192" element={<LearnPage mode="pro192" />} />
            <Route path="/pro192/pe-challenges" element={<Navigate to="/pe" replace />} />
            <Route path="/pro192/*" element={<LearnPage mode="pro192" />} />
            <Route path="/docs" element={<LearnPage mode="docs" />} />
            <Route path="/docs/*" element={<LearnPage mode="docs" />} />
            <Route path="/resources" element={<LearnPage mode="resources" />} />
            <Route path="/pe" element={<PeHubPage />} />
            <Route path="/pe/mock" element={<MockExamPage />} />
            <Route path="/pe/mock/:paper" element={<MockExamPage />} />
            <Route path="/studio" element={<CodeStudioPage />} />
            <Route path="/studio/playground" element={<CodeStudioPage isPlayground />} />
            <Route path="/studio/:peId" element={<CodeStudioPage />} />
            <Route path="/notes" element={<NotesHubPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
