import React, { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import HomePage from './pages/dashboard/DashboardHomePage';
import InvoicesPage from './pages/dashboard/InvoicesPage';
import InvoiceDetailPage from './pages/dashboard/InvoiceDetailPage';
import VendorsPage from './pages/dashboard/VendorsPage';
import WorkflowsPage from './pages/dashboard/WorkflowsPage';
import ReportsPage from './pages/dashboard/ReportsPage';
import ForecastingPage from './pages/dashboard/ForecastingPage';
import SettingsPage from './pages/dashboard/SettingsPage';

import { User } from './types';
import { ToastProvider } from './hooks/useToast';
import { useInvoicesStore } from './store';
import Spinner from './components/shared/Spinner';

// --- Auth Context for User Data ---
interface AuthContextType {
  user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
// ---------------------------------------------------


const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { fetchInvoices, initialized } = useInvoicesStore();

  useEffect(() => {
    if (!initialized) {
      fetchInvoices();
    }
  }, [initialized, fetchInvoices]);

  if (!initialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <div className="text-center">
            <Spinner />
            <p className="mt-2 text-sm text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};


function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = useCallback((loggedInUser: User) => {
    setUser(loggedInUser);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <ToastProvider>
      <AuthContext.Provider value={{ user }}>
        <HashRouter>
          <Routes>
            <Route path="/login" element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/*" element={
              user ? (
                <DashboardLayout user={user} onLogout={handleLogout}>
                  <AppInitializer>
                    <Routes>
                      <Route path="/" element={<Navigate to="/home" replace />} />
                      <Route path="/home" element={<HomePage />} />
                      <Route path="/invoices" element={<InvoicesPage />} />
                      <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                      <Route path="/vendors" element={<VendorsPage />} />
                      <Route path="/workflows" element={<WorkflowsPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/forecasting" element={<ForecastingPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<Navigate to="/home" replace />} />
                    </Routes>
                  </AppInitializer>
                </DashboardLayout>
              ) : (
                <Navigate to="/login" />
              )
            } />
          </Routes>
        </HashRouter>
      </AuthContext.Provider>
    </ToastProvider>
  );
}

export default App;