import RoomManager from './RoomManager.js';
import SyncManager from './SyncManager.js';
import ChatManager from './ChatManager.js';

export default function socketHandler(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room
    socket.on('join_room', (data) => {
      RoomManager.joinRoom(socket, io, data);
    });

    // Leave room
    socket.on('leave_room', (data) => {
      RoomManager.leaveRoom(socket, io, data);
    });

    // Sync play video
    socket.on('play', (data) => {
      SyncManager.handlePlay(socket, io, data);
    });

    // Sync pause video
    socket.on('pause', (data) => {
      SyncManager.handlePause(socket, io, data);
    });

    // Sync seek video
    socket.on('seek', (data) => {
      SyncManager.handleSeek(socket, io, data);
    });

    // Change video
    socket.on('change_video', (data) => {
      SyncManager.handleChangeVideo(socket, io, data);
    });

    // Send chat message
    socket.on('chat_message', (data) => {
      ChatManager.handleChatMessage(socket, io, data);
    });

    // React with Emoji
    socket.on('emoji_reaction', (data) => {
      ChatManager.handleEmojiReaction(socket, io, data);
    });

    // Typing indicators
    socket.on('typing', (data) => {
      ChatManager.handleTyping(socket, io, data);
    });

    // Assign Role (Host only)
    socket.on('assign_role', (data) => {
      RoomManager.assignRole(socket, io, data);
    });

    // Remove Participant (Host only)
    socket.on('remove_participant', (data) => {
      RoomManager.removeParticipant(socket, io, data);
    });

    // Transfer host (Host only)
    socket.on('transfer_host', (data) => {
      RoomManager.transferHost(socket, io, data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      RoomManager.handleDisconnect(socket, io);
    });
  });
}
