import { useState } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';
import { extractYoutubeId } from '../utils/youtube';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Link, Play, Clipboard, LogOut, Trash2 } from 'lucide-react';

export default function ControlsTab() {
  const [videoUrl, setVideoUrl] = useState('');
  const { room, role, changeVideo, leaveRoom } = useRoomStore();
  const { user } = useAuthStore();

  const isHost = role === 'HOST';
  const isParticipant = role === 'PARTICIPANT';

  // Handle loading new YouTube link
  const handleLoadVideo = (e) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    const extractedId = extractYoutubeId(videoUrl);
    if (!extractedId) {
      toast.error('Could not extract a valid YouTube video ID from that link.');
      return;
    }

    changeVideo(extractedId);
    setVideoUrl('');
    toast.success('Loading new video...');
  };

  // Copy room link to clipboard
  const handleCopyLink = () => {
    if (!room) return;
    const inviteUrl = `${window.location.origin}/room/${room.roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Watch party invite link copied to clipboard!');
  };

  // Copy code only
  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomCode);
    toast.success('Room code copied!');
  };

  // Explicitly Leave Room
  const handleLeaveRoom = () => {
    if (confirm('Are you sure you want to leave this watch party?')) {
      window.location.href = '/dashboard';
    }
  };

  // Host: Delete Room completely
  const handleDeleteRoom = async () => {
    if (!room) return;
    if (confirm('WARNING: This will delete the room and disconnect all participants. Continue?')) {
      try {
        const response = await api.delete(`/rooms/${room.roomCode}`);
        if (response.data.success) {
          toast.success('Room deleted successfully.');
          window.location.href = '/dashboard';
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete room');
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-290px)] min-h-[400px] flex-col bg-zinc-950/40 rounded-xl p-4 overflow-y-auto justify-between space-y-4">
      {/* Upper controls block */}
      <div className="space-y-4">
        {/* Load video segment */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Queue Video
          </h4>
          <form onSubmit={handleLoadVideo} className="flex gap-2">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={isParticipant}
              placeholder={
                isParticipant
                  ? 'Only hosts or moderators can change video'
                  : 'Paste YouTube URL (e.g. youtube.com/watch?...)'
              }
              className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-600/50 disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isParticipant || !videoUrl.trim()}
              className="rounded-lg bg-red-600/90 hover:bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Load
            </button>
          </form>
        </div>

        {/* Share Info block */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Invite Friends
          </h4>

          {/* Room code display */}
          <div className="flex justify-between items-center bg-zinc-900/60 border border-zinc-800/40 rounded-lg p-2.5">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">Room Code</span>
              <span className="text-sm font-bold tracking-wider text-zinc-100">{room?.roomCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded bg-zinc-800 hover:bg-zinc-700/80 transition-colors text-zinc-400 hover:text-zinc-200 cursor-pointer"
              title="Copy Code"
            >
              <Clipboard size={14} />
            </button>
          </div>

          {/* Invite link display */}
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 w-full bg-red-950/20 text-red-500 border border-red-900/30 hover:bg-red-900/20 rounded-lg p-2.5 text-xs font-bold transition-all cursor-pointer"
          >
            <Link size={12} /> Copy Invite URL
          </button>
        </div>
      </div>

      {/* Exit control buttons block */}
      <div className="space-y-2 border-t border-zinc-800/50 pt-4">
        {/* Leave watch party */}
        <button
          onClick={handleLeaveRoom}
          className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 border border-zinc-800 rounded-lg p-2.5 text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut size={12} /> Leave Watch Party
        </button>

        {/* Delete Room (Host only) */}
        {isHost && (
          <button
            onClick={handleDeleteRoom}
            className="flex items-center justify-center gap-2 w-full bg-red-900/10 hover:bg-red-900/25 text-red-500 border border-red-900/20 rounded-lg p-2.5 text-xs font-bold transition-all cursor-pointer"
          >
            <Trash2 size={12} /> Terminate Watch Room
          </button>
        )}
      </div>
    </div>
  );
}
