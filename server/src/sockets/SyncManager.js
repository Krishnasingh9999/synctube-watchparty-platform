import Room from '../models/Room.js';
import PermissionManager from './PermissionManager.js';

class SyncManager {
  /**
   * Handle play event
   */
  async handlePlay(socket, io, { roomId, currentTime }) {
    try {
      const roomCode = roomId.toUpperCase();
      const userId = socket.userId;

      if (!userId) return;

      const hasPermission = await PermissionManager.canControlPlayback(roomCode, userId);
      if (!hasPermission) {
        socket.emit('permission_denied', {
          success: false,
          message: 'Permission denied',
        });
        return;
      }

      // Update room in DB
      await Room.findOneAndUpdate(
        { roomCode },
        { isPlaying: true, currentTime }
      );

      // Broadcast to other participants in the room
      socket.to(roomCode).emit('video_played', { currentTime });
      console.log(`Room ${roomCode}: Video played at ${currentTime}s by user ${userId}`);
    } catch (error) {
      console.error('Error in handlePlay socket:', error);
    }
  }

  /**
   * Handle pause event
   */
  async handlePause(socket, io, { roomId, currentTime }) {
    try {
      const roomCode = roomId.toUpperCase();
      const userId = socket.userId;

      if (!userId) return;

      const hasPermission = await PermissionManager.canControlPlayback(roomCode, userId);
      if (!hasPermission) {
        socket.emit('permission_denied', {
          success: false,
          message: 'Permission denied',
        });
        return;
      }

      // Update room in DB
      await Room.findOneAndUpdate(
        { roomCode },
        { isPlaying: false, currentTime }
      );

      // Broadcast to other participants in the room
      socket.to(roomCode).emit('video_paused', { currentTime });
      console.log(`Room ${roomCode}: Video paused at ${currentTime}s by user ${userId}`);
    } catch (error) {
      console.error('Error in handlePause socket:', error);
    }
  }

  /**
   * Handle seek event
   */
  async handleSeek(socket, io, { roomId, currentTime }) {
    try {
      const roomCode = roomId.toUpperCase();
      const userId = socket.userId;

      if (!userId) return;

      const hasPermission = await PermissionManager.canControlPlayback(roomCode, userId);
      if (!hasPermission) {
        socket.emit('permission_denied', {
          success: false,
          message: 'Permission denied',
        });
        return;
      }

      // Update room in DB
      await Room.findOneAndUpdate(
        { roomCode },
        { currentTime }
      );

      // Broadcast to other participants in the room
      socket.to(roomCode).emit('video_seeked', { currentTime });
      console.log(`Room ${roomCode}: Video seeked to ${currentTime}s by user ${userId}`);
    } catch (error) {
      console.error('Error in handleSeek socket:', error);
    }
  }

  /**
   * Handle change video event
   */
  async handleChangeVideo(socket, io, { roomId, videoId }) {
    try {
      const roomCode = roomId.toUpperCase();
      const userId = socket.userId;

      if (!userId) return;

      const hasPermission = await PermissionManager.canControlPlayback(roomCode, userId);
      if (!hasPermission) {
        socket.emit('permission_denied', {
          success: false,
          message: 'Permission denied',
        });
        return;
      }

      // Update room in DB (reset timer and set paused initially)
      await Room.findOneAndUpdate(
        { roomCode },
        { currentVideoId: videoId, currentTime: 0, isPlaying: false }
      );

      // Broadcast to everyone in the room (including sender, to load the new video player source)
      io.to(roomCode).emit('video_changed', { videoId });
      console.log(`Room ${roomCode}: Video changed to ${videoId} by user ${userId}`);
    } catch (error) {
      console.error('Error in handleChangeVideo socket:', error);
    }
  }
}

export default new SyncManager();
