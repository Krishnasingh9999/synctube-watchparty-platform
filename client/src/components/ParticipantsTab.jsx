import { useState } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';
import { Crown, Shield, User, UserMinus, ShieldAlert, Award, MoreVertical } from 'lucide-react';

export default function ParticipantsTab() {
  const { room, role: currentUserRole, assignRole, kickUser, transferHost } = useRoomStore();
  const { user: currentUser } = useAuthStore();
  const [activeMenu, setActiveMenu] = useState(null); // stores participant user ID of active dropdown

  const participants = room?.participants || [];
  const isHost = currentUserRole === 'HOST';

  const toggleDropdown = (userId) => {
    if (activeMenu === userId) {
      setActiveMenu(null);
    } else {
      setActiveMenu(userId);
    }
  };

  return (
    <div className="flex h-[calc(100vh-290px)] min-h-[400px] flex-col bg-zinc-950/40 rounded-xl p-4 overflow-y-auto space-y-3 relative">
      <div className="flex justify-between items-center pb-2 border-b border-zinc-800/40">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Watch Party Members ({participants.length})
        </h3>
        <span className="text-[10px] bg-red-950/30 text-red-500 border border-red-900/30 px-2 py-0.5 rounded-full font-semibold">
          {participants.filter(p => p.socketId !== null).length} Active
        </span>
      </div>

      <div className="space-y-2.5">
        {participants.map((p) => {
          const pUserId = (p.user && typeof p.user === 'object') ? (p.user._id || p.user.id || p.user) : p.user;
          const pUserIdStr = pUserId ? pUserId.toString() : '';
          const currentUserIdStr = currentUser?.id?.toString() || currentUser?._id?.toString() || '';
          const isSelf = pUserIdStr && currentUserIdStr && pUserIdStr === currentUserIdStr;
          const isOnline = p.socketId !== null;

          return (
            <div
              key={pUserId}
              className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/20 hover:bg-zinc-900/70 transition-all duration-150 relative group"
            >
              {/* Member profile info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={p.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.name}`}
                    alt={p.name}
                    className={`h-9 w-9 rounded-lg bg-zinc-800 p-0.5 object-cover ${
                      !isOnline ? 'opacity-40 grayscale' : ''
                    }`}
                  />
                  {/* Status Indicator */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 ${
                      isOnline ? 'bg-green-500' : 'bg-zinc-600'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold ${isOnline ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      {p.name}
                    </span>
                    {isSelf && (
                      <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1 rounded">
                        You
                      </span>
                    )}
                  </div>

                  {/* Badges based on role */}
                  <div className="flex items-center gap-1 mt-0.5">
                    {p.role === 'HOST' && (
                      <span className="flex items-center gap-0.5 text-[9px] text-red-500 font-bold bg-red-950/20 px-1.5 py-0.5 rounded border border-red-900/20">
                        <Crown size={9} /> HOST
                      </span>
                    )}
                    {p.role === 'MODERATOR' && (
                      <span className="flex items-center gap-0.5 text-[9px] text-blue-400 font-bold bg-blue-950/20 px-1.5 py-0.5 rounded border border-blue-900/20">
                        <Shield size={9} /> MOD
                      </span>
                    )}
                    {p.role === 'PARTICIPANT' && (
                      <span className="flex items-center gap-0.5 text-[9px] text-zinc-400 font-medium bg-zinc-800/40 px-1.5 py-0.5 rounded">
                        <User size={9} /> MEMBER
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Host actions dropdown */}
              {isHost && !isSelf && (
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown(pUserId)}
                    className="p-1 rounded bg-zinc-800/45 hover:bg-zinc-700/60 transition-colors text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {/* Dropdown Box */}
                  {activeMenu === pUserId && (
                    <div className="absolute right-0 mt-1.5 w-44 rounded-lg bg-zinc-950 border border-zinc-800 shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                      {/* Promote / Demote */}
                      {p.role === 'PARTICIPANT' ? (
                        <button
                          onClick={() => {
                            assignRole(pUserId, 'MODERATOR');
                            setActiveMenu(null);
                          }}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-zinc-900 rounded-md cursor-pointer transition-colors"
                        >
                          <Shield size={12} /> Promote to Mod
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            assignRole(pUserId, 'PARTICIPANT');
                            setActiveMenu(null);
                          }}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-900 rounded-md cursor-pointer transition-colors"
                        >
                          <User size={12} /> Demote to Member
                        </button>
                      )}

                      {/* Transfer Host */}
                      <button
                        onClick={() => {
                          if (confirm(`Transfer room host ownership to ${p.name}?`)) {
                            transferHost(pUserId);
                            setActiveMenu(null);
                          }
                        }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-amber-500 hover:bg-zinc-900 rounded-md cursor-pointer transition-colors"
                      >
                        <Crown size={12} /> Make Host
                      </button>

                      <hr className="my-1 border-zinc-800" />

                      {/* Kick participant */}
                      <button
                        onClick={() => {
                          if (confirm(`Kick ${p.name} from the room?`)) {
                            kickUser(pUserId);
                            setActiveMenu(null);
                          }
                        }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-950/20 hover:text-red-400 rounded-md cursor-pointer transition-colors"
                      >
                        <UserMinus size={12} /> Kick Member
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
