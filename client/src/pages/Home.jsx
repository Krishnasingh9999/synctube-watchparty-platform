import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Tv, Users, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col selection:bg-red-600/30 selection:text-red-200">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative overflow-hidden">
        {/* Ambient Red Glow Backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute top-2/3 left-1/4 w-[250px] h-[250px] bg-red-850/5 rounded-full blur-[80px] pointer-events-none z-0" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Watch YouTube Together
            <span className="block mt-2 bg-gradient-to-r from-red-500 via-red-600 to-amber-500 bg-clip-text text-transparent">
              In Perfect Sync.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed font-light">
            SyncTube allows friends to watch videos online in total unison. Create watch party rooms, chat in real-time, react with emoji flows, and delegate moderation privileges.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold text-white px-8 py-3.5 shadow-lg active-glow transition-all duration-150 transform hover:-translate-y-0.5"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold text-white px-8 py-3.5 shadow-lg active-glow transition-all duration-150 transform hover:-translate-y-0.5"
                >
                  Create a Watch Party
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-sm font-bold text-zinc-300 px-8 py-3.5 transition-all duration-150 transform hover:-translate-y-0.5"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-zinc-950/40 border-t border-zinc-900/60 py-16 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Features Built for Entertainment</h2>
            <p className="text-xs text-zinc-500">Engineered with modern sockets for zero desynchronization lag.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Playback Sync */}
            <div className="glass-panel rounded-xl p-6 space-y-4 hover:border-red-950/40 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-red-950/20 text-red-500 border border-red-900/35 flex items-center justify-center">
                <Tv size={20} />
              </div>
              <h3 className="font-bold text-zinc-200">Video Sync</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Plays, pauses, and scrub timeline events instantly propagate to all clients. Zero-lag playback aligns automatically when you join.
              </p>
            </div>

            {/* Live Chat */}
            <div className="glass-panel rounded-xl p-6 space-y-4 hover:border-red-950/40 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-red-950/20 text-red-500 border border-red-900/35 flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <h3 className="font-bold text-zinc-200">Real-time Interaction</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Message history stores directly in MongoDB while Socket.IO handles live chats, typing states, and animated floating emoji reactions.
              </p>
            </div>

            {/* RBAC Privileges */}
            <div className="glass-panel rounded-xl p-6 space-y-4 hover:border-red-950/40 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-red-950/20 text-red-500 border border-red-900/35 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-zinc-200">Role Authority (RBAC)</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Host grants moderator powers to delegates. Participants are watch-only, preventing unwanted pauses or scrubbing hijack attempts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600 bg-zinc-950/90">
        <p>&copy; {new Date().getFullYear()} SyncTube watch parties. Developed under high-performance standards.</p>
      </footer>
    </div>
  );
}
