import { useAuthStore } from '../store/useAuthStore';
import { useRoomStore } from '../store/useRoomStore';
import { useNavigate, Link } from 'react-router-dom';
import { Tv, LogOut, Radio, User, Compass } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { socketConnected } = useRoomStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const res = await logout();
    if (res.success) {
      toast.success('Logged out successfully');
      navigate('/login');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
      {/* Brand Logo */}
      <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-white hover:opacity-95 transition-opacity">
        <div className="rounded-lg bg-red-600 p-1.5 flex items-center justify-center text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]">
          <Tv size={18} />
        </div>
        <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          SyncTube
        </span>
      </Link>

      {/* Navigation items / user card */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* Live Server Socket indicator */}
            <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-full text-[11px] font-medium text-zinc-400">
              <span className={`h-2.5 w-2.5 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {socketConnected ? 'Realtime Connected' : 'Server Offline'}
            </div>

            {/* Dashboard shortcut link */}
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-xs font-semibold px-2.5 py-1.5 transition-colors"
            >
              <Compass size={14} /> Dashboard
            </Link>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-2.5 border-l border-zinc-800 pl-4">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                alt={user.name}
                className="h-7 w-7 rounded-lg bg-zinc-950 border border-zinc-850 p-0.5 object-cover"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-zinc-300 tracking-wide">{user.name}</p>
                <p className="text-[10px] text-zinc-500">Member</p>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-1.5 ml-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-950/40 hover:bg-red-950/10 transition-all cursor-pointer"
                title="Log Out"
              >
                <LogOut size={13} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-zinc-400 hover:text-zinc-200 text-xs font-semibold px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white px-4 py-2 shadow-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
