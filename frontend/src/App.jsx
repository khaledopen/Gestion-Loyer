import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ImmeublesPage from './pages/immeubles/ImmeublesPage';
import ImmeubleDetailsPage from './pages/immeubles/ImmeubleDetailsPage';
import AppartementsPage from './pages/appartements/AppartementsPage';
import LocatairesPage from './pages/locataires/LocatairesPage';
import PaiementsPage from './pages/paiements/PaiementsPage';
import ImpayesPage from './pages/impayes/ImpayesPage';
import ReparationsPage from './pages/reparations/ReparationsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="immeubles" element={<ImmeublesPage />} />
            <Route path="immeubles/:id" element={<ImmeubleDetailsPage />} />
            <Route path="appartements" element={<AppartementsPage />} />
            <Route path="locataires" element={<LocatairesPage />} />
            <Route path="paiements" element={<PaiementsPage />} />
            <Route path="impayes" element={<ImpayesPage />} />
            <Route path="reparations" element={<ReparationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
