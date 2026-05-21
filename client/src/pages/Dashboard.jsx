import { useState } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { extractYoutubeId } from '../utils/youtube';
import toast from 'react-hot-toast';
import { PlusCircle, Link2, Tv, Film } from 'lucide-react';

export default function Dashboard() {
  const [starterUrl, setStarterUrl] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  const { createRoom, joinRoom } = useRoomStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Create Room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreateLoading(true);

    let videoId = 'dQw4w9WgXcQ'; // Default Rick Astley
    if (starterUrl.trim()) {
      const extracted = extractYoutubeId(starterUrl);
      if (!extracted) {
        toast.error('Could not extract a valid YouTube ID from starter URL. Using default.');
      } else {
        videoId = extracted;
      }
    }

    const res = await createRoom(videoId);
    setCreateLoading(false);

    if (res.success) {
      toast.success('Watch Room Created!');
      navigate(`/room/${res.roomCode}`);
    } else {
      toast.error(res.message);
    }
  };

  // Join Room
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) {
      toast.error('Please enter a room code');
      return;
    }

    setJoinLoading(true);
    const code = roomCodeInput.trim().toUpperCase();
    const res = await joinRoom(code);
    setJoinLoading(false);

    if (res.success) {
      toast.success('Joined Room!');
      navigate(`/room/${code}`);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#08080a] py-12 px-6 flex flex-col items-center justify-center relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-red-650/5 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Welcome Banner */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Welcome back, <span className="text-red-500">{user?.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-light">
            Start a new collaborative video room or jump in with your friends.
          </p>
        </div>

        {/* Action Panel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          
          {/* Create Room Card */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-red-950/40 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-950/20 text-red-500 border border-red-900/35 flex items-center justify-center shadow-lg">
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-200">Start a Watch Party</h3>
                  <p className="text-[11px] text-zinc-500">Become the host and launch a sync room</p>
                </div>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-3.5 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Starter YouTube URL (Optional)
                  </label>
                  <div className="relative">
                    <Film className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                    <input
                      type="text"
                      value={starterUrl}
                      onChange={(e) => setStarterUrl(e.target.value)}
                      placeholder="Paste YouTube Link (Leave blank for default)"
                      className="w-full rounded-lg bg-zinc-900 border border-zinc-800/80 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white py-3 shadow-lg active-glow transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {createLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    'Generate Sync Room'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Join Room Card */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-red-950/40 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-950/20 text-red-500 border border-red-900/35 flex items-center justify-center shadow-lg">
                  <Link2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-200">Join Watch Party</h3>
                  <p className="text-[11px] text-zinc-500">Enter a code to connect to an active party</p>
                </div>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-3.5 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Room Code
                  </label>
                  <div className="relative">
                    <Tv className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value)}
                      placeholder="e.g. ABCD123"
                      className="w-full rounded-lg bg-zinc-900 border border-zinc-800/80 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600/50 tracking-wider uppercase font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={joinLoading}
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-bold text-zinc-300 py-3 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {joinLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    'Connect to Party'
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
