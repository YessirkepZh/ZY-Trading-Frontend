import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import DealsPage from './pages/DealsPage';
import DealDetailPage from './pages/DealDetailPage';
import AnalysisPage from './pages/AnalysisPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/deals/:id" element={<DealDetailPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </AuthGuard>
    </BrowserRouter>
  );
}
