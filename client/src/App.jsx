import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Toaster } from 'react-hot-toast';

// Layout Wrappers
import ProtectedRoute from './layouts/ProtectedRoute';
import PublicRoute from './layouts/PublicRoute';

// Page Views
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import WatchRoom from './pages/WatchRoom';
import NotFound from './pages/NotFound';

export default function App() {
  const { checkAuth } = useAuthStore();

  // Run session check on initial application mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      {/* Global Toast Alert notifications handler */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'glass-panel text-zinc-100 text-xs font-semibold rounded-xl border border-zinc-800 shadow-2xl',
          duration: 3500,
          style: {
            background: 'rgba(18, 18, 22, 0.95)',
            color: '#f4f4f5',
          },
          success: {
            iconTheme: {
              primary: '#ef4444', // Red themed success check icon
              secondary: '#ffffff',
            },
          },
        }}
      />

      <Routes>
        {/* PUBLIC ROUTING LAYER */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* STANDALONE ROUTING LAYER (Accessible by anyone) */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* PROTECTED ROUTING LAYER */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/room/:roomId" element={<WatchRoom />} />
        </Route>

        {/* FALLBACK 404 ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
