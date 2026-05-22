import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Tv, Lock, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { resetPassword, loading, error, clearError } = useAuthStore();
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    clearError();

    if (!password || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      setFormError('Password must be alphanumeric (contain both letters and numbers)');
      return;
    }

    const res = await resetPassword(token, password);
    if (res.success) {
      setSuccessMessage(res.message || 'Password updated successfully!');
      toast.success('Password updated! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } else {
      toast.error(res.message || 'Failed to reset password');
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
          <h2 className="text-xl font-bold tracking-tight text-zinc-200 mt-2">Reset Password</h2>
          <p className="text-xs text-zinc-500 font-light">Set a strong and secure new password</p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30 p-3 text-xs text-emerald-500 font-semibold">
            <CheckCircle size={14} className="flex-shrink-0" />
            <p>{successMessage}</p>
          </div>
        )}

        {/* Error Alert */}
        {(formError || error) && !successMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-red-950/20 border border-red-900/30 p-3 text-xs text-red-500 font-semibold">
            <AlertCircle size={14} className="flex-shrink-0" />
            <p>{formError || error}</p>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800/80 pl-11 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600/50"
                disabled={loading || !!successMessage}
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Must be at least 6 characters and contain both letters and numbers.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800/80 pl-11 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600/50"
                disabled={loading || !!successMessage}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !!successMessage}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold text-white py-3 shadow-lg active-glow transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                Update Password <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 font-medium">
          <Link to="/login" className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors font-semibold">
            <ArrowLeft size={13} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
