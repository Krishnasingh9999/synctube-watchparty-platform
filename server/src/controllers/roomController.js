import Room from '../models/Room.js';
import { customAlphabet } from 'nanoid';

// Alphanumeric room code generator of length 8
const generateRoomCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

// Create Room
export const createRoom = async (req, res) => {
  try {
    const { videoId } = req.body;
    const roomCode = generateRoomCode();

    const room = new Room({
      roomCode,
      host: req.user._id,
      participants: [
        {
          user: req.user._id,
          name: req.user.name,
          avatar: req.user.avatar,
          role: 'HOST',
        },
      ],
      currentVideoId: videoId || 'dQw4w9WgXcQ',
      currentTime: 0,
      isPlaying: false,
    });

    await room.save();

    return res.status(201).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error('Create room error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Join Room (validate existence and return details)
export const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;

    if (!roomCode) {
      return res.status(400).json({ success: false, message: 'Room code is required' });
    }

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error('Join room error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Get Room by Room Code
export const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params; // Can be roomCode or ID. We support looking up by roomCode first, then fallback to ID.
    let room = await Room.findOne({ roomCode: roomId.toUpperCase() });

    if (!room) {
      // Check if it's a valid Mongo ObjectId
      if (roomId.match(/^[0-9a-fA-F]{24}$/)) {
        room = await Room.findById(roomId);
      }
    }

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error('Get room error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Delete Room (Only Host)
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomCode: roomId.toUpperCase() });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Enforce Host Authorization
    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Permission denied: Only the host can delete the room' });
    }

    await Room.deleteOne({ _id: room._id });

    return res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    console.error('Delete room error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Transfer Host (Only Host)
export const transferHost = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { targetUserId } = req.body;

    const room = await Room.findOne({ roomCode: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Permission denied: Only the host can transfer hosting' });
    }

    // Verify target participant is in the room
    const targetParticipantIndex = room.participants.findIndex(
      (p) => p.user.toString() === targetUserId.toString()
    );

    if (targetParticipantIndex === -1) {
      return res.status(400).json({ success: false, message: 'User is not a participant in this room' });
    }

    // Set new host
    const oldHostId = room.host;
    room.host = targetUserId;

    // Update roles inside participants array
    room.participants.forEach((p) => {
      if (p.user.toString() === targetUserId.toString()) {
        p.role = 'HOST';
      } else if (p.user.toString() === oldHostId.toString()) {
        p.role = 'PARTICIPANT'; // Demote old host to participant (or moderator if preferred)
      }
    });

    await room.save();

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error('Transfer host error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Assign Role (Only Host)
export const assignRole = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { targetUserId, role } = req.body; // role can be MODERATOR or PARTICIPANT

    if (!['MODERATOR', 'PARTICIPANT'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role assignment' });
    }

    const room = await Room.findOne({ roomCode: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Permission denied: Only the host can assign roles' });
    }

    // Host cannot assign role to themselves
    if (targetUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot assign roles to the host' });
    }

    // Find and update role in participants array
    const participant = room.participants.find(
      (p) => p.user.toString() === targetUserId.toString()
    );

    if (!participant) {
      return res.status(400).json({ success: false, message: 'User is not a participant in this room' });
    }

    participant.role = role;

    // Also update moderators array list
    if (role === 'MODERATOR') {
      if (!room.moderators.includes(targetUserId)) {
        room.moderators.push(targetUserId);
      }
    } else {
      room.moderators = room.moderators.filter((mId) => mId.toString() !== targetUserId.toString());
    }

    await room.save();

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error('Assign role error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Remove User / Kick Participant (Only Host)
export const removeUser = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { targetUserId } = req.body;

    const room = await Room.findOne({ roomCode: roomId.toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Permission denied: Only the host can kick participants' });
    }

    if (targetUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Host cannot kick themselves' });
    }

    // Remove user from participants list
    room.participants = room.participants.filter(
      (p) => p.user.toString() !== targetUserId.toString()
    );

    // Remove from moderators list if applicable
    room.moderators = room.moderators.filter((mId) => mId.toString() !== targetUserId.toString());

    await room.save();

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error('Remove user error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
