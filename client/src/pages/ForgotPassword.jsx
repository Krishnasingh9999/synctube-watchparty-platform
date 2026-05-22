import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { Tv, Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');

  const { forgotPassword, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    clearError();

    if (!email) {
      setFormError('Please enter your email address');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    const res = await forgotPassword(email);
    if (res.success) {
      setSuccessMessage(res.message || 'Reset link sent! Please check your email.');
      toast.success('Password reset link sent successfully!');
    } else {
      toast.error(res.message || 'Failed to send reset link');
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
          <h2 className="text-xl font-bold tracking-tight text-zinc-200 mt-2">Forgot Password</h2>
          <p className="text-xs text-zinc-500 font-light">Enter your email to receive a password reset link</p>
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
                disabled={loading}
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
                Send Reset Link <ArrowRight size={15} />
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
