import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { Tv, Mail, Lock, User, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [formError, setFormError] = useState('');

  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Set initial random seed on mount
  useEffect(() => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  }, []);

  const handleRandomizeAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  const getAvatarUrl = () => {
    // Generate avatar using the seed (dicebear robot style)
    const seed = name.trim() ? `${name.trim()}-${avatarSeed}` : avatarSeed;
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!name || !email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      setFormError('Password must contain both letters and numbers');
      return;
    }

    const avatar = getAvatarUrl();
    const res = await register(name, email, password, avatar);
    if (res.success) {
      toast.success('Account created! Please sign in.');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-red-650/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Main card */}
      <div className="w-full max-w-md glass-panel-glow rounded-2xl p-8 relative z-10 space-y-6">
        
        {/* Brand */}
        <div className="flex flex-col items-center space-y-2">
          <Link to="/" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <div className="rounded-lg bg-red-600 p-1.5 flex items-center justify-center text-white">
              <Tv size={16} />
            </div>
            <span className="font-black text-base text-white tracking-tight">SyncTube</span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-zinc-200 mt-2">Create your account</h2>
          <p className="text-xs text-zinc-500 font-light">Set up your profile and launch your watch room</p>
        </div>

        {/* Errors */}
        {(formError || error) && (
          <div className="flex items-center gap-2 rounded-lg bg-red-950/20 border border-red-900/30 p-3 text-xs text-red-500 font-semibold">
            <AlertCircle size={14} className="flex-shrink-0" />
            <p>{formError || error}</p>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar selector block */}
          <div className="flex flex-col items-center space-y-2.5 p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/40">
            <div className="relative">
              <img
                src={getAvatarUrl()}
                alt="Profile Avatar Preview"
                className="h-16 w-16 rounded-xl bg-zinc-900 border border-zinc-800 p-1 object-cover"
              />
              <button
                type="button"
                onClick={handleRandomizeAvatar}
                className="absolute -bottom-1 -right-1 p-1 rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                title="Randomize Avatar"
              >
                <RefreshCw size={11} className="animate-spin-hover" />
              </button>
            </div>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              Profile Avatar Preview
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800/80 pl-11 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800/80 pl-11 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800/80 pl-11 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600/50"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold text-white py-3 shadow-lg active-glow transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                Register Account <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-red-500 hover:underline hover:text-red-400 font-semibold transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
