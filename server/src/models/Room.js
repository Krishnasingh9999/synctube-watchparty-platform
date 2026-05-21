import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['HOST', 'MODERATOR', 'PARTICIPANT'],
    default: 'PARTICIPANT',
  },
  socketId: {
    type: String,
    default: null,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    participants: [participantSchema],
    currentVideoId: {
      type: String,
      default: 'dQw4w9WgXcQ', // Rick Astley is a classic starter video!
    },
    currentTime: {
      type: Number,
      default: 0,
    },
    isPlaying: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;
