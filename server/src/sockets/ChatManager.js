import Message from '../models/Message.js';
import Room from '../models/Room.js';
import User from '../models/User.js';

class ChatManager {
  /**
   * Handle chat messages
   */
  async handleChatMessage(socket, io, { roomId, text }) {
    try {
      const roomCode = roomId.toUpperCase();
      const userId = socket.userId;

      if (!userId || !text) return;

      const room = await Room.findOne({ roomCode });
      if (!room) return;

      const user = await User.findById(userId);
      if (!user) return;

      // Save to database
      const newMessage = new Message({
        room: room._id,
        sender: user._id,
        senderName: user.name,
        senderAvatar: user.avatar,
        text,
      });

      await newMessage.save();

      // Emit to all users in the room
      io.to(roomCode).emit('chat_message', {
        _id: newMessage._id,
        room: room._id,
        sender: user._id,
        senderName: user.name,
        senderAvatar: user.avatar,
        text: newMessage.text,
        createdAt: newMessage.createdAt,
      });
    } catch (error) {
      console.error('Error in handleChatMessage socket:', error);
    }
  }

  /**
   * Handle emoji reactions
   */
  async handleEmojiReaction(socket, io, { roomId, emoji }) {
    try {
      const roomCode = roomId.toUpperCase();
      const userId = socket.userId;

      if (!userId || !emoji) return;

      // Broadcast reaction to other room members
      socket.to(roomCode).emit('emoji_reaction', {
        userId,
        emoji,
      });
    } catch (error) {
      console.error('Error in handleEmojiReaction socket:', error);
    }
  }

  /**
   * Handle user typing indicator
   */
  async handleTyping(socket, io, { roomId, isTyping }) {
    try {
      const roomCode = roomId.toUpperCase();
      const userId = socket.userId;

      if (!userId) return;

      const user = await User.findById(userId);
      if (!user) return;

      // Broadcast typing indicator to others
      socket.to(roomCode).emit('user_typing', {
        userId,
        name: user.name,
        isTyping,
      });
    } catch (error) {
      console.error('Error in handleTyping socket:', error);
    }
  }
}

export default new ChatManager();
