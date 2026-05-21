import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Home, Compass, HelpCircle } from 'lucide-react';

export default function NotFound() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-red-650/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="text-center space-y-6 max-w-md relative z-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-red-500 shadow-xl mb-4">
          <HelpCircle size={32} />
        </div>
        
        <h1 className="text-6xl font-black tracking-tighter text-white">404</h1>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-zinc-200">Lost in Synchronization</h2>
          <p className="text-xs text-zinc-500 font-light">
            We couldn't find the watch party room or page you were looking for. It might have been deleted, closed, or never existed.
          </p>
        </div>

        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white px-6 py-3.5 shadow-lg active-glow transition-all duration-150 transform hover:-translate-y-0.5 cursor-pointer"
        >
          {isAuthenticated ? (
            <>
              <Compass size={14} /> Back to Dashboard
            </>
          ) : (
            <>
              <Home size={14} /> Back to Home
            </>
          )}
        </Link>
      </div>
    </div>
  );
}
