import mongoose from 'mongoose';
import Room from '../models/Room.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/synctube');
    console.log('Connected to DB');

    const users = await User.find({});
    console.log('\n--- USERS ---');
    console.log(users.map(u => ({ id: u._id, name: u.name, email: u.email })));

    const rooms = await Room.find({});
    console.log('\n--- ROOMS ---');
    rooms.forEach(r => {
      console.log(`Room: ${r.roomCode}, Host: ${r.host}, isPlaying: ${r.isPlaying}`);
      console.log('Participants:');
      r.participants.forEach(p => {
        console.log(` - User: ${p.user}, Name: ${p.name}, Role: ${p.role}, SocketId: ${p.socketId}`);
      });
      console.log('------------------------');
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

checkDB();
