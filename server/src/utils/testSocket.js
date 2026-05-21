import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to socket server');
  
  // Let's join Room WY7E6G3M as Krishna (ID: 6a0ef07cd7429ef4b926af81)
  socket.emit('join_room', {
    roomId: 'WY7E6G3M',
    userId: '6a0ef07cd7429ef4b926af81',
  });
});

socket.on('sync_state', (data) => {
  console.log('RECEIVED sync_state:', data);
});

socket.on('room_state_updated', (data) => {
  console.log('RECEIVED room_state_updated:', data);
  console.log('host type:', typeof data.host, data.host);
  console.log('participants:', data.participants);
  socket.disconnect();
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
