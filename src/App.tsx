import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { AppProvider } from './context/AppContext';
import { DocsPage } from './pages/DocsPage';
import { HomePage } from './pages/HomePage';
import { PeArenaPage } from './pages/PeArenaPage';
import { Pro192Page } from './pages/Pro192Page';
import { ResourcesPage } from './pages/ResourcesPage';

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
      <h1 className="text-xl font-bold text-[var(--text-primary)]">Không tìm thấy trang (404)</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
      >
        Về trang chủ JavaBrew
      </Link>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/pro192" element={<Pro192Page />} />
        <Route path="/pro192/pe-challenges" element={<Navigate to="/pe" replace />} />
        <Route path="/pro192/:slug" element={<Pro192Page />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/docs/*" element={<DocsPage />} />
        <Route path="/pe" element={<PeArenaPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
