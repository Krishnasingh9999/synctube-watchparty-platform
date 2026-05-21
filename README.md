# SyncTube – Real-Time Collaborative Watch Party Platform

SyncTube is a full-stack real-time collaborative watch party platform where users can create rooms, watch YouTube videos together in sync, chat live, react with emojis, and manage room roles in real time.

## Features

- Real-time synchronized video playback (play, pause, seek, change video)
- Live room chat with persistent message history
- Floating emoji reactions
- Typing indicators
- Role-based access control (Host, Moderator, Participant)
- Room creation and join via room codes
- Secure JWT authentication
- Protected routes and session handling
- Redis adapter support for horizontal scaling
- Graceful fallback when Redis is unavailable

---

## Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Zustand
- Axios
- Socket.IO Client

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- Redis
- JWT Authentication
- Cookie Parser

---

## Architecture Overview

The system follows a client-server real-time event-driven architecture.

- **Frontend Client** handles UI rendering, authentication state, room interactions, and WebSocket communication.
- **Backend API Server** manages authentication, room lifecycle, authorization, and persistent data operations.
- **Socket.IO Layer** handles bidirectional low-latency real-time communication.
- **MongoDB** stores users, rooms, and chat history.
- **Redis Adapter** enables distributed event propagation when multiple backend instances are deployed.

---

## Project Structure

```bash
SyncTube/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── store/
│   │   └── utils/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── sockets/
│   │   └── utils/
│   └── package.json
```

---

## Setup and Run Instructions

### Prerequisites

Make sure you have installed:

- Node.js (v18 or above)
- MongoDB
- Redis (optional, for scaling support)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/synctube.git
cd synctube
```

---

### 2. Backend Setup

Go to the server folder:

```bash
cd server
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
REDIS_URL=your_redis_connection_string
```

Start backend server:

```bash
npm run dev
```

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd client
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start frontend:

```bash
npm run dev
```

---

## Local Development URLs

Frontend:

```bash
http://localhost:5173
```

Backend:

```bash
http://localhost:5000
```

---

## Live Deployment URL

Frontend:  
**https://your-live-frontend-url.com**

Backend API:  
**https://your-live-backend-url.com**



---

## Core Functionality

### Authentication
- User registration
- User login
- Logout
- Session validation

### Watch Party Features
- Create room
- Join room
- Real-time synchronized playback
- Change shared video
- Role management
- Participant management

### Interactive Features
- Live messaging
- Typing indicators
- Emoji reactions
- Presence tracking

---

## Scalability

The application supports horizontal scaling using Redis Pub/Sub with Socket.IO adapters, allowing multiple backend instances to stay synchronized for real-time communication.

If Redis is unavailable, the server falls back to in-memory mode so development can continue without interruption.

---

## Author

Krishna Singh
