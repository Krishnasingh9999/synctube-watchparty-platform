import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://synctube-watchparty-platform.onrender.com';

export const useRoomStore = create((set, get) => ({
  room: null,
  role: 'PARTICIPANT',
  socket: null,
  socketConnected: false,
  chatMessages: [],
  typingUsers: {},
  reactions: [],
  videoAction: null, // format: { type: 'play'|'pause'|'seek'|'change', time: number, videoId: string, timestamp: number }
  loading: false,
  error: null,

  // REST API: Create Room
  createRoom: async (videoId = 'dQw4w9WgXcQ') => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/rooms/create', { videoId });
      set({ room: response.data.room, loading: false });
      return { success: true, roomCode: response.data.room.roomCode };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create room';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  // REST API: Join Room (Verification)
  joinRoom: async (roomCode) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/rooms/join', { roomCode });
      set({ room: response.data.room, loading: false });
      return { success: true, room: response.data.room };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join room';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  // REST API: Get Room Details
  fetchRoomDetails: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}`);
      set({ room: response.data.room });
      return response.data.room;
    } catch (error) {
      console.error('Fetch room details error:', error);
      return null;
    }
  },

  // Load Message History
  loadMessageHistory: async (roomCode) => {
    try {
      const response = await api.get(`/messages/${roomCode}`);
      set({ chatMessages: response.data.messages });
    } catch (error) {
      console.error('Failed to load message history:', error);
    }
  },

  // Initialize Socket.IO connection and bind listeners
  initSocket: (roomCode, userId) => {
    // If socket exists, clean up first
    if (get().socket) {
      get().disconnectSocket();
    }

    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    set({ socket: socketInstance });

    socketInstance.on('connect', () => {
      set({ socketConnected: true });
      console.log('Socket connected:', socketInstance.id);
      
      // Join room
      socketInstance.emit('join_room', {
        roomId: roomCode,
        userId,
      });
    });

    socketInstance.on('disconnect', () => {
      set({ socketConnected: false });
      console.log('Socket disconnected');
    });

    // Synchronize initial player state upon joining
    socketInstance.on('sync_state', ({ videoId, currentTime, isPlaying, role }) => {
      set({ role });
      set((state) => ({
        room: state.room ? { ...state.room, currentVideoId: videoId, currentTime, isPlaying } : null,
        videoAction: { type: 'change', videoId, time: currentTime, isPlaying, timestamp: Date.now() },
      }));
    });

    // Room participant updates
    socketInstance.on('room_state_updated', (updatedData) => {
      set((state) => ({
        room: state.room ? { ...state.room, ...updatedData } : null,
      }));
      // Re-evaluate user role in case it was updated by the host
      const currentUserId = userId || useAuthStore.getState().user?.id || useAuthStore.getState().user?._id;
      const hostId = (updatedData.host && typeof updatedData.host === 'object') ? (updatedData.host._id || updatedData.host.id || updatedData.host) : updatedData.host;
      
      const hostIdStr = hostId ? hostId.toString() : '';
      const currentUserIdStr = currentUserId ? currentUserId.toString() : '';

      if (hostIdStr && currentUserIdStr && hostIdStr === currentUserIdStr) {
        set({ role: 'HOST' });
      } else {
        const participants = updatedData.participants || [];
        const self = participants.find((p) => {
          const pUserId = (p.user && typeof p.user === 'object') ? (p.user._id || p.user.id || p.user) : p.user;
          const pUserIdStr = pUserId ? pUserId.toString() : '';
          return pUserIdStr && currentUserIdStr && pUserIdStr === currentUserIdStr;
        });
        if (self) {
          set({ role: self.role });
        }
      }
    });

    // Suggested socket event listeners
    socketInstance.on('user_joined', ({ username, userId: joinedUserId, participants }) => {
      set((state) => ({
        room: state.room ? { ...state.room, participants } : null,
      }));
      const currentUserId = userId || useAuthStore.getState().user?.id || useAuthStore.getState().user?._id;
      const currentUserIdStr = currentUserId ? currentUserId.toString() : '';
      if (joinedUserId !== currentUserIdStr) {
        toast.success(`${username} joined the watch party!`);
      }
    });

    socketInstance.on('user_left', ({ participants }) => {
      set((state) => ({
        room: state.room ? { ...state.room, participants } : null,
      }));
    });

    socketInstance.on('role_assigned', ({ userId: targetUserId, username, role: newRole, participants }) => {
      set((state) => ({
        room: state.room ? { ...state.room, participants } : null,
      }));
      const currentUserId = userId || useAuthStore.getState().user?.id || useAuthStore.getState().user?._id;
      const currentUserIdStr = currentUserId ? currentUserId.toString() : '';
      if (targetUserId === currentUserIdStr) {
        set({ role: newRole });
        toast.success(`You have been promoted to ${newRole}!`);
      } else {
        toast.success(`${username} is now a ${newRole.toLowerCase()}.`);
      }
    });

    socketInstance.on('participant_removed', ({ participants }) => {
      set((state) => ({
        room: state.room ? { ...state.room, participants } : null,
      }));
    });

    // Playback sync listeners
    socketInstance.on('video_played', ({ currentTime }) => {
      set({
        videoAction: { type: 'play', time: currentTime, timestamp: Date.now() },
      });
    });

    socketInstance.on('video_paused', ({ currentTime }) => {
      set({
        videoAction: { type: 'pause', time: currentTime, timestamp: Date.now() },
      });
    });

    socketInstance.on('video_seeked', ({ currentTime }) => {
      set({
        videoAction: { type: 'seek', time: currentTime, timestamp: Date.now() },
      });
    });

    socketInstance.on('video_changed', ({ videoId }) => {
      set({
        videoAction: { type: 'change', videoId, time: 0, isPlaying: false, timestamp: Date.now() },
      });
    });

    // Chat listener
    socketInstance.on('chat_message', (message) => {
      set((state) => ({
        chatMessages: [...state.chatMessages, message],
      }));
    });

    // Emoji overlay listener
    socketInstance.on('emoji_reaction', ({ userId: reactingUserId, emoji }) => {
      const id = `${reactingUserId}-${Date.now()}-${Math.random()}`;
      set((state) => ({
        reactions: [...state.reactions, { id, emoji, rotation: Math.floor(Math.random() * 40) - 20 }],
      }));

      // Cleanup reaction float item after 2.5s animation
      setTimeout(() => {
        set((state) => ({
          reactions: state.reactions.filter((r) => r.id !== id),
        }));
      }, 2500);
    });

    // Typing listener
    socketInstance.on('user_typing', ({ userId: typingUserId, name, isTyping }) => {
      set((state) => {
        const nextTyping = { ...state.typingUsers };
        if (isTyping) {
          nextTyping[typingUserId] = name;
        } else {
          delete nextTyping[typingUserId];
        }
        return { typingUsers: nextTyping };
      });
    });

    // Handle Kicked from Room
    socketInstance.on('kicked', () => {
      toast.error('You have been removed from the room by the host.');
      get().disconnectSocket();
      set({ room: null, role: 'PARTICIPANT' });
      window.location.href = '/dashboard';
    });

    // Permission issues
    socketInstance.on('permission_denied', ({ message }) => {
      toast.error(message || 'Action denied');
    });

    socketInstance.on('error_message', ({ message }) => {
      toast.error(message || 'Error occurred');
    });
  },

  // Disconnect socket and clear listeners
  disconnectSocket: () => {
    const s = get().socket;
    if (s) {
      s.off('connect');
      s.off('disconnect');
      s.off('sync_state');
      s.off('room_state_updated');
      s.off('user_joined');
      s.off('user_left');
      s.off('role_assigned');
      s.off('participant_removed');
      s.off('video_played');
      s.off('video_paused');
      s.off('video_seeked');
      s.off('video_changed');
      s.off('chat_message');
      s.off('emoji_reaction');
      s.off('user_typing');
      s.off('kicked');
      s.off('permission_denied');
      s.off('error_message');
      s.disconnect();
    }
    set({ socket: null, socketConnected: false, chatMessages: [], typingUsers: {}, reactions: [], videoAction: null });
  },

  // Leave room action
  leaveRoom: (userId) => {
    const s = get().socket;
    const r = get().room;
    if (s && r) {
      s.emit('leave_room', { roomId: r.roomCode, userId });
    }
    get().disconnectSocket();
    set({ room: null, role: 'PARTICIPANT' });
  },

  // Socket playback triggers
  playVideo: (currentTime) => {
    const s = get().socket;
    const r = get().room;
    if (s && r) {
      s.emit('play', { roomId: r.roomCode, currentTime });
    }
  },

  pauseVideo: (currentTime) => {
    const s = get().socket;
    const r = get().room;
    if (s && r) {
      s.emit('pause', { roomId: r.roomCode, currentTime });
    }
  },

  seekVideo: (currentTime) => {
    const s = get().socket;
    const r = get().room;
    if (s && r) {
      s.emit('seek', { roomId: r.roomCode, currentTime });
    }
  },

  changeVideo: (videoId) => {
    const s = get().socket;
    const r = get().room;
    if (s && r) {
      s.emit('change_video', { roomId: r.roomCode, videoId });
    }
  },

  // Socket chat triggers
  sendChatMessage: (text) => {
    const s = get().socket;
    const r = get().room;
    if (s && r) {
      s.emit('chat_message', { roomId: r.roomCode, text });
    }
  },

  sendEmojiReaction: (emoji) => {
    const s = get().socket;
    const r = get().room;
    if (s && r) {
      s.emit('emoji_reaction', { roomId: r.roomCode, emoji });
      
      // Also show local float immediately
      const id = `self-${Date.now()}-${Math.random()}`;
      set((state) => ({
        reactions: [...state.reactions, { id, emoji, rotation: Math.floor(Math.random() * 40) - 20 }],
      }));
      setTimeout(() => {
        set((state) => ({
          reactions: state.reactions.filter((r) => r.id !== id),
        }));
      }, 2500);
    }
  },

  sendTypingStatus: (isTyping) => {
    const s = get().socket;
    const r = get().room;
    if (s && r) {
      s.emit('typing', { roomId: r.roomCode, isTyping });
    }
  },

  // Host operations
  assignRole: (targetUserId, role) => {
    const s = get().socket;
    const r = get().room;
    if (s && r) {
      s.emit('assign_role', { roomId: r.roomCode, targetUserId, role });
    }
  },

  kickUser: (targetUserId) => {
    const s = get().socket;
    const r = get().room;
    if (s && r) {
      s.emit('remove_participant', { roomId: r.roomCode, targetUserId });
    }
  },

  transferHost: (targetUserId) => {
    const s = get().socket;
    const r = get().room;
    if (s && r) {
      s.emit('transfer_host', { roomId: r.roomCode, targetUserId });
    }
  },
}));
