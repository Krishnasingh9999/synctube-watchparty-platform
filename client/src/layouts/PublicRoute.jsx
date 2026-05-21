import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function PublicRoute() {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-red-600 mb-3" />
        <p className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Synchronizing...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
