import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute, GuestRoute } from './PrivateRoute.jsx';
import { AuthProvider } from '../contexts/AuthContext.jsx';
import { ToastProvider, useToast } from '../contexts/ToastContext.jsx';
import { ToastContainer } from '../components/ui/Toast.jsx';

// Pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import CustomerProfilePage from '../pages/CustomerProfilePage';
import NewInvoicePage from '../pages/NewInvoicePage';
import EditInvoicePage from '../pages/EditInvoicePage';

// Layout
import Layout from '../components/Layout';

function ToastHost() {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} onClose={removeToast} />;
}

/**
 * InnerApp - Contains routes with ToastContainer access
 */
function InnerApp() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="customers/:id" element={<CustomerProfilePage />} />
          <Route path="invoices/new" element={<NewInvoicePage />} />
          <Route path="invoices/:id/edit" element={<EditInvoicePage />} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastHost />
    </>
  );
}

/**
 * AppRoutes - Main application routing configuration
 */
function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <InnerApp />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;