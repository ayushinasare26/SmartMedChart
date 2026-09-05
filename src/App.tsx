import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import NurseDashboardPage from './pages/NurseDashboardPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import PatientsListPage from './pages/PatientsListPage';
import PatientEMARPage from './pages/PatientEMARPage';
import CPOEPrescriptionPage from './pages/CPOEPrescriptionPage';
import BedsideScannerPage from './pages/BedsideScannerPage';
import SafetyAuditPage from './pages/SafetyAuditPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';
import PatientPortalPage from './pages/PatientPortalPage';
import { useAuth } from './hooks/useAuth';

function RoleRedirect() {
  const { user } = useAuth();
  if (user?.role === 'PATIENT') return <Navigate to="/patient-portal" replace />;
  if (user?.role === 'NURSE') return <Navigate to="/nurse" replace />;
  if (user?.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
  if (user?.role === 'PHARMACIST') return <Navigate to="/prescriptions" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']}><AdminPage /></ProtectedRoute>} />
      <Route path="/patient-portal" element={<ProtectedRoute allowedRoles={['PATIENT', 'ADMIN', 'DOCTOR', 'NURSE']}><PatientPortalPage /></ProtectedRoute>} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />
        <Route path="/nurse" element={<ProtectedRoute allowedRoles={['NURSE', 'ADMIN']}><NurseDashboardPage /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}><DoctorDashboardPage /></ProtectedRoute>} />
        <Route path="/patients" element={<PatientsListPage />} />
        <Route path="/patients/:id" element={<PatientEMARPage />} />
        <Route path="/prescriptions" element={<CPOEPrescriptionPage />} />
        <Route path="/prescriptions/new" element={<CPOEPrescriptionPage />} />
        <Route path="/bedside-scan" element={<BedsideScannerPage />} />
        <Route path="/safety-audit" element={<SafetyAuditPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/unauthorized" element={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
            <h2>Access Denied</h2>
            <p>You don't have permission to view this page.</p>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
