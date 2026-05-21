import Room from '../models/Room.js';

class PermissionManager {
  /**
   * Check if a user has permission to control video playback (play, pause, seek, change video).
   * Authorized roles: HOST, MODERATOR.
   */
  async canControlPlayback(roomCode, userId) {
    try {
      const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
      if (!room) return false;

      // Host has absolute access
      if (room.host.toString() === userId.toString()) {
        return true;
      }

      // Check participant role in DB
      const participant = room.participants.find(
        (p) => p.user.toString() === userId.toString()
      );

      if (!participant) return false;

      return ['HOST', 'MODERATOR'].includes(participant.role);
    } catch (error) {
      console.error('Error in canControlPlayback:', error);
      return false;
    }
  }

  /**
   * Check if a user has permission to manage the room (assign roles, kick users, transfer host).
   * Authorized roles: HOST.
   */
  async isHost(roomCode, userId) {
    try {
      const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
      if (!room) return false;

      return room.host.toString() === userId.toString();
    } catch (error) {
      console.error('Error in isHost check:', error);
      return false;
    }
  }

  /**
   * Check if user is a participant in the room.
   */
  async isParticipant(roomCode, userId) {
    try {
      const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
      if (!room) return false;

      return room.participants.some((p) => p.user.toString() === userId.toString());
    } catch (error) {
      console.error('Error in isParticipant check:', error);
      return false;
    }
  }
}

export default new PermissionManager();
