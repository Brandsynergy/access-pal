import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import ContactSupport from './pages/ContactSupport';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VisitorLanding from './pages/VisitorLanding';
import QRActivation from './pages/QRActivation';
import CallPrep from './pages/CallPrep';
import VisitorCall from './pages/VisitorCall';
import AdminPanel from './pages/AdminPanel';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public route component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={<Navigate to="/login" />} 
      />
      <Route 
        path="/register" 
        element={<ContactSupport />} 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <CallProvider>
              <Dashboard />
            </CallProvider>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/visitor/:qrCodeId" 
        element={<VisitorLanding />} 
      />
      <Route 
        path="/activate/:qrCodeId" 
        element={<QRActivation />} 
      />
      <Route 
        path="/prep/:qrCodeId" 
        element={<CallPrep />} 
      />
      <Route 
        path="/call/:qrCodeId" 
        element={<VisitorCall />} 
      />
      <Route 
        path="/admin-secret-2026" 
        element={<AdminPanel />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
