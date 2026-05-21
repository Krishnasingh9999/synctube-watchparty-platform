import Room from '../models/Room.js';
import User from '../models/User.js';
import PermissionManager from './PermissionManager.js';

class RoomManager {
  /**
   * Handle user joining a room via socket
   */
  async joinRoom(socket, io, { roomId, userId }) {
    try {
      const roomCode = roomId.toUpperCase();
      const roomCheck = await Room.findOne({ roomCode });

      if (!roomCheck) {
        socket.emit('error_message', { message: 'Room not found' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        socket.emit('error_message', { message: 'User not found' });
        return;
      }

      // Determine role: Host if room.host is this user, or if they are in moderators list, otherwise participant
      let assignedRole = 'PARTICIPANT';
      if (roomCheck.host.toString() === userId.toString()) {
        assignedRole = 'HOST';
      } else if (roomCheck.moderators.some((mId) => mId.toString() === userId.toString())) {
        assignedRole = 'MODERATOR';
      }

      // Atomically update or insert participant in Room
      let room = await Room.findOneAndUpdate(
        { roomCode, "participants.user": userId },
        {
          $set: {
            "participants.$.socketId": socket.id,
            "participants.$.role": assignedRole,
            "participants.$.name": user.name,
            "participants.$.avatar": user.avatar,
          }
        },
        { new: true }
      );

      if (!room) {
        room = await Room.findOneAndUpdate(
          { roomCode },
          {
            $push: {
              participants: {
                user: userId,
                name: user.name,
                avatar: user.avatar,
                role: assignedRole,
                socketId: socket.id,
                joinedAt: new Date(),
              }
            }
          },
          { new: true }
        );
      }

      if (!room) {
        socket.emit('error_message', { message: 'Failed to join room' });
        return;
      }

      // Join socket room
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.userId = userId;

      // Send initial synchronization state to the newly joined client
      socket.emit('sync_state', {
        videoId: room.currentVideoId,
        currentTime: room.currentTime,
        isPlaying: room.isPlaying,
        role: assignedRole,
      });

      // Notify all users in the room with the updated list of participants
      io.to(roomCode).emit('room_state_updated', {
        roomCode,
        host: room.host,
        moderators: room.moderators,
        participants: room.participants,
        currentVideoId: room.currentVideoId,
      });

      // Emit assignment-specified user_joined event
      io.to(roomCode).emit('user_joined', {
        username: user.name,
        userId: user._id.toString(),
        role: assignedRole,
        participants: room.participants,
      });

      // Broadcast text alert to chat
      io.to(roomCode).emit('chat_message', {
        _id: `system-${Date.now()}`,
        room: room._id,
        senderName: 'System',
        senderAvatar: '',
        text: `${user.name} joined the room.`,
        createdAt: new Date(),
        isSystem: true,
      });

      console.log(`Socket ${socket.id} (User: ${user.name}) joined room ${roomCode}`);
    } catch (error) {
      console.error('Error in joinRoom socket handler:', error);
      socket.emit('error_message', { message: 'Failed to join room' });
    }
  }

  /**
   * Handle user explicitly leaving a room
   */
  async leaveRoom(socket, io, { roomId, userId }) {
    try {
      const roomCode = roomId.toUpperCase();
      const user = await User.findById(userId);
      const name = user ? user.name : 'A user';

      // Remove from participants list atomically
      let room = await Room.findOneAndUpdate(
        { roomCode },
        { $pull: { participants: { user: userId } } },
        { new: true }
      );

      if (!room) return;

      // Handle host leaving
      if (room.host.toString() === userId.toString()) {
        if (room.participants.length > 0) {
          // Promote next online participant to Host
          const activeParticipant = room.participants.find((p) => p.socketId !== null) || room.participants[0];
          
          if (activeParticipant) {
            room = await Room.findOneAndUpdate(
              { roomCode, "participants.user": activeParticipant.user },
              {
                $set: {
                  host: activeParticipant.user,
                  "participants.$.role": 'HOST'
                }
              },
              { new: true }
            );

            if (room) {
              io.to(roomCode).emit('chat_message', {
                _id: `system-${Date.now()}`,
                room: room._id,
                senderName: 'System',
                senderAvatar: '',
                text: `${activeParticipant.name} has been promoted to Host.`,
                createdAt: new Date(),
                isSystem: true,
              });
            }
          }
        }
      }

      // Leave socket room
      socket.leave(roomCode);
      socket.roomCode = null;
      socket.userId = null;

      if (room) {
        // Notify other clients
        io.to(roomCode).emit('room_state_updated', {
          roomCode,
          host: room.host,
          moderators: room.moderators,
          participants: room.participants,
          currentVideoId: room.currentVideoId,
        });

        // Emit assignment-specified user_left event
        io.to(roomCode).emit('user_left', {
          username: name,
          userId: userId.toString(),
          participants: room.participants,
        });

        io.to(roomCode).emit('chat_message', {
          _id: `system-${Date.now()}`,
          room: room._id,
          senderName: 'System',
          senderAvatar: '',
          text: `${name} left the room.`,
          createdAt: new Date(),
          isSystem: true,
        });
      }
    } catch (error) {
      console.error('Error in leaveRoom socket handler:', error);
    }
  }

  /**
   * Assign role via socket (Only Host)
   */
  async assignRole(socket, io, { roomId, targetUserId, role }) {
    try {
      const roomCode = roomId.toUpperCase();
      const userId = socket.userId;

      if (!userId) return;

      const isHost = await PermissionManager.isHost(roomCode, userId);
      if (!isHost) {
        socket.emit('permission_denied', { success: false, message: 'Permission denied' });
        return;
      }

      let updateQuery = {
        $set: { "participants.$.role": role }
      };

      if (role === 'MODERATOR') {
        updateQuery.$addToSet = { moderators: targetUserId };
      } else {
        updateQuery.$pull = { moderators: targetUserId };
      }

      const room = await Room.findOneAndUpdate(
        { roomCode, "participants.user": targetUserId },
        updateQuery,
        { new: true }
      );

      if (!room) return;

      const participant = room.participants.find((p) => p.user.toString() === targetUserId.toString());
      const participantName = participant ? participant.name : 'Participant';

      // Broadcast changes
      io.to(roomCode).emit('room_state_updated', {
        roomCode,
        host: room.host,
        moderators: room.moderators,
        participants: room.participants,
        currentVideoId: room.currentVideoId,
      });

      // Emit assignment-specified role_assigned event
      io.to(roomCode).emit('role_assigned', {
        userId: targetUserId.toString(),
        username: participantName,
        role: role,
        participants: room.participants,
      });

      io.to(roomCode).emit('chat_message', {
        _id: `system-${Date.now()}`,
        room: room._id,
        senderName: 'System',
        senderAvatar: '',
        text: `${participantName} is now a ${role.toLowerCase()}.`,
        createdAt: new Date(),
        isSystem: true,
      });
    } catch (error) {
      console.error('Error in assignRole socket handler:', error);
    }
  }

  /**
   * Remove participant / Kick (Only Host)
   */
  async removeParticipant(socket, io, { roomId, targetUserId }) {
    try {
      const roomCode = roomId.toUpperCase();
      const userId = socket.userId;

      if (!userId) return;

      const isHost = await PermissionManager.isHost(roomCode, userId);
      if (!isHost) {
        socket.emit('permission_denied', { success: false, message: 'Permission denied' });
        return;
      }

      const roomCheck = await Room.findOne({ roomCode });
      if (!roomCheck) return;

      const target = roomCheck.participants.find((p) => p.user.toString() === targetUserId.toString());
      if (!target) return;

      const targetSocketId = target.socketId;
      const targetName = target.name;

      // Filter out user and moderators atomically
      const room = await Room.findOneAndUpdate(
        { roomCode },
        {
          $pull: {
            participants: { user: targetUserId },
            moderators: targetUserId
          }
        },
        { new: true }
      );

      if (!room) return;

      // Force target socket to leave the room if connected
      if (targetSocketId && io.sockets.sockets.has(targetSocketId)) {
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        targetSocket.emit('kicked', { roomId: roomCode });
        targetSocket.leave(roomCode);
        targetSocket.roomCode = null;
      }

      // Notify the room
      io.to(roomCode).emit('room_state_updated', {
        roomCode,
        host: room.host,
        moderators: room.moderators,
        participants: room.participants,
        currentVideoId: room.currentVideoId,
      });

      // Emit assignment-specified participant_removed event
      io.to(roomCode).emit('participant_removed', {
        userId: targetUserId.toString(),
        participants: room.participants,
      });

      io.to(roomCode).emit('chat_message', {
        _id: `system-${Date.now()}`,
        room: room._id,
        senderName: 'System',
        senderAvatar: '',
        text: `${targetName} has been removed from the room.`,
        createdAt: new Date(),
        isSystem: true,
      });
    } catch (error) {
      console.error('Error in removeParticipant socket handler:', error);
    }
  }

  /**
   * Transfer host (Only Host)
   */
  async transferHost(socket, io, { roomId, targetUserId }) {
    try {
      const roomCode = roomId.toUpperCase();
      const userId = socket.userId;

      if (!userId) return;

      const isHost = await PermissionManager.isHost(roomCode, userId);
      if (!isHost) {
        socket.emit('permission_denied', { success: false, message: 'Permission denied' });
        return;
      }

      const roomCheck = await Room.findOne({ roomCode });
      if (!roomCheck) return;

      const target = roomCheck.participants.find((p) => p.user.toString() === targetUserId.toString());
      if (!target) return;

      const oldHostId = roomCheck.host;

      // Atomically update host and assign/demote roles inside participants array using arrayFilters
      const room = await Room.findOneAndUpdate(
        { roomCode },
        {
          $set: {
            host: targetUserId,
            "participants.$[targetUser].role": 'HOST',
            "participants.$[oldHost].role": 'PARTICIPANT'
          }
        },
        {
          arrayFilters: [
            { "targetUser.user": targetUserId },
            { "oldHost.user": oldHostId }
          ],
          new: true
        }
      );

      if (!room) return;

      // Notify room
      io.to(roomCode).emit('room_state_updated', {
        roomCode,
        host: room.host,
        moderators: room.moderators,
        participants: room.participants,
        currentVideoId: room.currentVideoId,
      });

      io.to(roomCode).emit('chat_message', {
        _id: `system-${Date.now()}`,
        room: room._id,
        senderName: 'System',
        senderAvatar: '',
        text: `${target.name} is now the Host.`,
        createdAt: new Date(),
        isSystem: true,
      });
    } catch (error) {
      console.error('Error in transferHost socket handler:', error);
    }
  }

  /**
   * Handle socket disconnect (mark user offline, cleanup if empty)
   */
  async handleDisconnect(socket, io) {
    try {
      const { roomCode, userId } = socket;
      if (!roomCode || !userId) return;

      // Atomically mark participant disconnected by setting socketId to null
      // only if the socketId matches this disconnecting socket
      const room = await Room.findOneAndUpdate(
        { roomCode, "participants.user": userId, "participants.socketId": socket.id },
        { $set: { "participants.$.socketId": null } },
        { new: true }
      );

      if (!room) return;

      const participant = room.participants.find(
        (p) => p.user.toString() === userId.toString()
      );

      if (participant) {
        // Notify room of connection state changes
        io.to(roomCode).emit('room_state_updated', {
          roomCode,
          host: room.host,
          moderators: room.moderators,
          participants: room.participants,
          currentVideoId: room.currentVideoId,
        });

        // Emit assignment-specified user_left event for disconnects
        io.to(roomCode).emit('user_left', {
          username: participant.name,
          userId: userId.toString(),
          participants: room.participants,
        });

        // Broadcast disconnection in chat
        io.to(roomCode).emit('chat_message', {
          _id: `system-${Date.now()}`,
          room: room._id,
          senderName: 'System',
          senderAvatar: '',
          text: `${participant.name} disconnected.`,
          createdAt: new Date(),
          isSystem: true,
        });
      }
    } catch (error) {
      console.error('Error in handleDisconnect socket handler:', error);
    }
  }
}

export default new RoomManager();
