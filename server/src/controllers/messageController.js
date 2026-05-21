import Message from '../models/Message.js';
import Room from '../models/Room.js';

// Retrieve room chat history
export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params; // Can be roomCode or Room ID

    // Find the room first
    let room = await Room.findOne({ roomCode: roomId.toUpperCase() });
    if (!room) {
      if (roomId.match(/^[0-9a-fA-F]{24}$/)) {
        room = await Room.findById(roomId);
      }
    }

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Retrieve messages belonging to room
    const messages = await Message.find({ room: room._id })
      .sort({ createdAt: 1 }) // Chronological order
      .limit(100); // Guard rails to prevent loading thousands at once

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Get messages error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
