import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Navbar from '../components/Navbar';

export default function ProtectedRoute() {
  const { isAuthenticated, isCheckingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-red-600 mb-3" />
        <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Verifying User Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
