# 📺 SyncTube - Collaborative Real-Time Watch Party Platform

[![React](https://img.shields.io/badge/React-19.0-blue?logo=react&logoColor=white)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.7-black?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Redis Scaled](https://img.shields.io/badge/Redis-Adapter-red?logo=redis&logoColor=white)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

SyncTube is a production-grade, full-stack collaborative watch party platform. It enables multiple users to join virtual rooms and watch YouTube videos in perfect real-time synchronization. Powered by a robust MERN stack, Socket.IO, and a Redis event bus, SyncTube guarantees synchronized playback, instant persistent chat, typing indicators, dynamic user roles, and interactive floating emoji reactions.

---

## 🌟 Key Features

*   **Perfect Playback Synchronization**: Seek, play, pause, and video changes are broadcast instantly to all room participants. Includes a smart ignore-window to prevent sync feedback loops.
*   **Role-Based Access Control (RBAC)**: Users are divided into **Hosts**, **Moderators**, and **Participants**. 
    *   *Hosts* have full administrative power (promote/demote roles, kick users, transfer hosting, delete rooms).
    *   *Moderators* can control playback and manage videos.
    *   *Participants* watch along with restricted controls (playback controls are overlayed with a secure blocker to prevent unauthorized scrubbing).
*   **Real-time Interactions**: Live sidebar chat, user presence lists, active typing indicators, and interactive floating emoji reactions that stream across the video screen.
*   **Scale-Out Ready**: Features a Plug-and-Play Socket.IO Redis Adapter connection supporting horizontal multi-instance scaling.
*   **Resilient Design**: Graceful fallback implementation on Redis connection failures (automatically defaults to the local Memory Adapter on write-restricted keys without crashing the server process).

---

## 🏗️ System Architecture

```mermaid
graph TD
    ClientA[Client A: Host] <-->|Socket.IO| Server1[SyncTube Server 1]
    ClientB[Client B: Participant] <-->|Socket.IO| Server2[SyncTube Server 2]
    
    Server1 <-->|Pub/Sub Adapter| RedisCluster[(Upstash / Redis Cluster)]
    Server2 <-->|Pub/Sub Adapter| RedisCluster
    
    Server1 & Server2 <-->|Query/Write| MongoDB[(MongoDB Database)]
```

---

## 📂 Directory Structure

```
c:/Users/Krishna/Desktop/Yotube System Design/
 ┣ client/                     # Frontend Single Page App (React + Vite)
 ┃ ┣ src/
 ┃ ┃ ┣ api/                    # Axios preconfigured REST wrapper
 ┃ ┃ ┣ components/             # VideoPlayer, ChatTab, ParticipantsTab, ControlsTab, EmojiReactions, Navbar
 ┃ ┃ ┣ layouts/                # ProtectedRoute and PublicRoute navigation guards
 ┃ ┃ ┣ pages/                  # Home, Login, Signup, Dashboard, WatchRoom, NotFound
 ┃ ┃ ┣ store/                  # Zustand state managers (useAuthStore, useRoomStore)
 ┃ ┃ ┣ utils/                  # YouTube URL parser and extractor
 ┃ ┃ ┣ App.jsx                 # Routing tree & global Toast provider
 ┃ ┃ ┗ main.jsx                # SPA DOM entry point
 ┃ ┣ index.css                 # Base Tailwind CSS, glassmorphism theme and custom animation keyframes
 ┃ ┣ vite.config.js            # Proxy routes and Tailwind compiler configuration
 ┃ ┗ package.json              # Frontend scripts & dependencies
 ┣ server/                     # Backend API & WebSocket Node server
 ┃ ┣ src/
 ┃ ┃ ┣ config/                 # DB connection routine (db.js)
 ┃ ┃ ┣ controllers/            # REST endpoint logic (authController, roomController, messageController)
 ┃ ┃ ┣ middleware/             # Route authentication protection guard
 ┃ ┃ ┣ models/                 # Mongoose database schemas (User, Room, Message)
 ┃ ┃ ┣ routes/                 # Express route mappings
 ┃ ┃ ┣ sockets/                # Socket.IO handlers (RoomManager, SyncManager, ChatManager, PermissionManager)
 ┃ ┃ ┣ utils/                  # Cookie setups and JWT signature helpers
 ┃ ┃ ┣ app.js                  # Security middlewares and Express setup
 ┃ ┃ ┗ server.js               # Main entry (Server initialization, Redis binding, fallback adapters)
 ┃ ┣ .env                      # Server configuration variables
 ┃ ┗ package.json              # Server dependencies and development runners
 ┗ README.md                   # System documentation & manual
```

---

## ⚙️ Configuration & Environment Variables

### Backend Setup (`server/.env`)
Create a `.env` file under the `/server` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/synctube
JWT_SECRET=supersecretjwtsecretkey12345_synctube_2026
CLIENT_URL=http://localhost:5173
REDIS_URL="rediss://default:yourpassword@your-redis-server.upstash.io:6379"  # Optional: For scale-out
```

> [!NOTE]
> If the `REDIS_URL` credentials do not support the `PUBLISH` command (e.g. read-only restricted users), the server will automatically log the warning and fallback to the standard in-memory adapter without crashing the process.

### Frontend Setup (`client/.env`)
*Optional* (Will default automatically in local development environments):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Running Locally

### Prerequisites
* **Node.js** (v18+)
* **MongoDB** (running locally or a remote MongoDB Atlas URI)
* **Redis** (optional, for testing multi-instance sync)

### Step 1: Install Dependencies
Run the install command inside both directories:
```bash
# Set up Backend
cd server
npm install

# Set up Frontend
cd ../client
npm install
```

### Step 2: Start Services
Open two terminal windows to run both servers concurrently:

**Terminal 1 (Backend API & Socket Server)**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend React Application)**
```bash
cd client
npm run dev
```
*   The frontend app will be served at **`http://localhost:5173`**
*   The backend server will run at **`http://localhost:5000`**

---

## 🔌 REST API Endpoints

### Authentication Routes
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Registers a new user. Attaches HTTP-only JWT token cookie. | No |
| `POST` | `/api/auth/login` | Authenticates existing user. Attaches JWT cookie. | No |
| `POST` | `/api/auth/logout` | Clears local JWT credentials and cookie. | Yes |
| `GET` | `/api/auth/me` | Validates session token and returns active user details. | Yes |

### Room & Session Management
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/rooms/create` | Spawns a new room with a random video source. Creator is set as `HOST`. | Yes |
| `POST` | `/api/rooms/join` | Validates room code before starting WebSocket transition. | Yes |
| `GET` | `/api/rooms/:roomId` | Fetches details and participant listings of a specific room. | Yes |
| `DELETE` | `/api/rooms/:roomId` | Destroys room, forcing client disconnects (Only available to Room Host). | Yes |

### Messaging Logs
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/messages/:roomId` | Retrieves the last 100 historical messages of the room from MongoDB. | Yes |

---

## 📡 Socket.IO Live Operations

All WebSocket events are routed through the default root namespace (`/`). Handshake verification parses user session credentials upon connection.

### 1. Administration & Session Presence
*   **`join_room`** (Client ➔ Server)
    *   *Payload*: `{ roomId: string, userId: string }`
    *   *Action*: Subscribes the socket client to the room channel, assigns role, maps the socket ID, and broadcasts updates.
*   **`leave_room`** (Client ➔ Server)
    *   *Payload*: `{ roomId: string, userId: string }`
    *   *Action*: Unsubscribes client. If the departing user was the `HOST`, ownership is automatically promoted to the next active user.
*   **`room_state_updated`** (Server ➔ Room)
    *   *Payload*: `{ roomCode: string, host: string, moderators: Array<string>, participants: Array<ParticipantObject>, currentVideoId: string }`
    *   *Action*: Transmits active user status changes to sync sidebar participant displays.
*   **`kicked`** (Server ➔ Single Client Target)
    *   *Payload*: `{ roomId: string }`
    *   *Action*: Triggers instant programmatic redirection of the targeted user back to the dashboard, destroying their socket connection.

### 2. Video Playback & Sync
*   **`play`** (Client ➔ Server)
    *   *Payload*: `{ roomId: string, currentTime: number }`
    *   *Action*: Verifies user credentials, sets room status to playing, and broadcasts `video_played`.
*   **`video_played`** (Server ➔ Room except sender)
    *   *Payload*: `{ currentTime: number }`
    *   *Action*: Triggers play on all other clients.
*   **`pause`** (Client ➔ Server)
    *   *Payload*: `{ roomId: string, currentTime: number }`
    *   *Action*: Sets room status to paused, and broadcasts `video_paused`.
*   **`video_paused`** (Server ➔ Room except sender)
    *   *Payload*: `{ currentTime: number }`
    *   *Action*: Pauses video playback for all other clients.
*   **`seek`** (Client ➔ Server)
    *   *Payload*: `{ roomId: string, currentTime: number }`
    *   *Action*: Updates database coordinates, and broadcasts `video_seeked`.
*   **`video_seeked`** (Server ➔ Room except sender)
    *   *Payload*: `{ currentTime: number }`
    *   *Action*: Forces player timelines on all other clients to jump to the target seek coordinates.
*   **`change_video`** (Client ➔ Server)
    *   *Payload*: `{ roomId: string, videoId: string }`
    *   *Action*: Replaces current video ID, resets timeline to 0s, sets pause state, and broadcasts `video_changed` to the entire room.

### 3. Interactivity & Indicators
*   **`chat_message`** (Client ➔ Server)
    *   *Payload*: `{ roomId: string, text: string }`
    *   *Action*: Saves the text into database history logs and relays it to all room members.
*   **`emoji_reaction`** (Client ➔ Server)
    *   *Payload*: `{ roomId: string, emoji: string }`
    *   *Action*: Instantly broadcasts reaction string to stream floating emojis on clients' screens.
*   **`typing`** (Client ➔ Server)
    *   *Payload*: `{ roomId: string, isTyping: boolean }`
    *   *Action*: Relays keyboard activities to render active typing badges in the sidebar.

---

## ⚡ Production Scalability

When scaling to support **1,000+ simultaneous users** and **100+ active rooms**, a single Node.js process will hit memory and CPU bounds. SyncTube handles scaling through:

1.  **State Partitioning**: Active session state is mapped inside MongoDB. Nodes remain stateless, querying details on-the-fly when processing API requests.
2.  **Horizontal Scalability (Redis Adapter)**: Supplying a valid `REDIS_URL` in `.env` swaps the local socket connection adapter for a high-speed Redis message broker. Events are instantly routed across multiple server instances.
3.  **Sticky Sessions**: Ensure load balancers (such as Nginx or AWS ALBs) are configured with sticky session cookies (`ip_hash` or cookie tracking) if utilizing Socket.IO's HTTP long-polling fallback connection layer.
#   s y n c t u b e - w a t c h p a r t y - p l a t f o r m  
 