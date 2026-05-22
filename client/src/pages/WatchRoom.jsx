import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';
import VideoPlayer from '../components/VideoPlayer';
import ChatTab from '../components/ChatTab';
import ParticipantsTab from '../components/ParticipantsTab';
import ControlsTab from '../components/ControlsTab';
import EmojiReactions from '../components/EmojiReactions';
import { MessageSquare, Users, Settings, Share2, Crown, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WatchRoom() {
  const { roomId } = useParams(); // roomCode
  const navigate = useNavigate();

  const {
    room,
    role,
    initSocket,
    leaveRoom,
    fetchRoomDetails,
    loadMessageHistory,
    socketConnected,
  } = useRoomStore();

  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('chat');
  const [pageLoading, setPageLoading] = useState(true);

  // Initialize Room & Sockets
  useEffect(() => {
    let active = true;

    const setupRoom = async () => {
      if (!roomId || !user) return;
      
      setPageLoading(true);
      // Fetch details via REST to verify room exists
      const roomDetails = await fetchRoomDetails(roomId);

      if (!active) return;

      if (!roomDetails) {
        toast.error('Watch room not found.');
        navigate('/dashboard');
        return;
      }

      // Load persistent chat history
      await loadMessageHistory(roomId);

      // Connect socket
      initSocket(roomId, user.id || user._id);
      setPageLoading(false);
    };

    setupRoom();

    return () => {
      active = false;
      if (user) {
        leaveRoom(user.id || user._id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user?.id, user?._id]);

  // Copy shareable invitation URL
  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite URL copied to clipboard!');
  };

  if (pageLoading || !room) {
    return (
      <div className="flex min-h-[calc(100vh-68px)] w-full items-center justify-center bg-[#08080a] text-zinc-400">
        <div className="flex flex-col items-center max-w-sm w-full p-6 text-center space-y-4">
          {/* Skeleton Loaders */}
          <div className="h-9 w-32 rounded-lg bg-zinc-900 border border-zinc-800 skeleton-loading" />
          <div className="h-56 w-full rounded-xl bg-zinc-900 border border-zinc-800 skeleton-loading" />
          <div className="h-4 w-48 rounded bg-zinc-900 skeleton-loading" />
        </div>
      </div>
    );
  }

  const activeParticipantsCount = room.participants ? room.participants.filter(p => p.socketId !== null).length : 0;

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#08080a] p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center relative">
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* LEFT COLUMN: Video Player & Header */}
        <div className="flex-1 flex flex-col space-y-4">
          
          {/* Room Metadata Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-zinc-950/40 border border-zinc-900/60 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
                  Watch Party
                </h2>
                <span className="text-xs bg-zinc-900 text-zinc-400 border border-zinc-800 px-2.5 py-0.5 rounded font-mono font-semibold">
                  CODE: {room.roomCode}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium">
                {activeParticipantsCount} active participant{activeParticipantsCount !== 1 ? 's' : ''} online
              </p>
            </div>

            {/* Quick Share Actions */}
            <div className="flex items-center gap-2.5">
              {/* Connection reconnecting warning */}
              {!socketConnected && (
                <span className="text-[10px] bg-red-950/40 border border-red-900/30 text-red-500 px-2 py-1 rounded font-bold animate-pulse">
                  Reconnecting...
                </span>
              )}
              
              {/* User role status */}
              <div className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-zinc-400 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-850">
                {role === 'HOST' && <span className="text-red-500 flex items-center gap-1"><Crown size={12} /> Host Mode</span>}
                {role === 'MODERATOR' && <span className="text-blue-400 flex items-center gap-1"><ShieldCheck size={12} /> Moderator</span>}
                {role === 'PARTICIPANT' && <span className="text-zinc-500 flex items-center gap-1"><User size={12} /> Participant</span>}
              </div>

              <button
                onClick={handleCopyInvite}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-xs font-bold text-white px-3.5 py-2.5 shadow-lg active-glow transition-all cursor-pointer"
              >
                <Share2 size={13} /> Share Room
              </button>
            </div>
          </div>

          {/* Player Shell wrapper (for floating emojis) */}
          <div className="relative w-full aspect-video">
            <VideoPlayer videoId={room.currentVideoId} role={role} />
            <EmojiReactions />
          </div>
        </div>

        {/* RIGHT COLUMN: Chat / Users / Controls Tabbed Panel */}
        <div className="w-full lg:w-[380px] flex flex-col space-y-4">
          
          {/* Tab Headers */}
          <div className="flex p-1 rounded-xl bg-zinc-950/80 border border-zinc-900">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-350'
              }`}
            >
              <MessageSquare size={13} /> Chat
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'participants'
                  ? 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-350'
              }`}
            >
              <Users size={13} /> Members
            </button>
            <button
              onClick={() => setActiveTab('controls')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'controls'
                  ? 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-350'
              }`}
            >
              <Settings size={13} /> Settings
            </button>
          </div>

          {/* Active Tab View */}
          <div className="glass-panel rounded-xl p-0 overflow-hidden shadow-2xl">
            {activeTab === 'chat' && <ChatTab />}
            {activeTab === 'participants' && <ParticipantsTab />}
            {activeTab === 'controls' && <ControlsTab />}
          </div>

        </div>

      </div>
    </div>
  );
}
