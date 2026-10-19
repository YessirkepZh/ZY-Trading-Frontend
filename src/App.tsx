import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import DealsPage from './pages/DealsPage';
import DealDetailPage from './pages/DealDetailPage';
import AnalysisPage from './pages/AnalysisPage';
import ChecklistsPage from './pages/ChecklistsPage';
import TradingSettingsPage from './pages/TradingSettingsPage';
import AccessPage from './pages/AccessPage';
import InvitePage from './pages/InvitePage';

function ProtectedApp() {
  return (
    <AuthGuard>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/deals/:id" element={<DealDetailPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/settings/trading" element={<TradingSettingsPage />} />
          <Route path="/settings/checklists" element={<ChecklistsPage />} />
          <Route path="/settings/access" element={<AccessPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/invite" element={<InvitePage />} />
        <Route path="*" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  );
}
