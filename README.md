# 🚀 CollaborativeFlow AI

A real-time collaborative Kanban board built with **React, Node.js, Express, MongoDB, and Socket.io**. The project is designed as a scalable project management platform with AI-powered insights, GitHub integration, and browser productivity tools planned for future phases.

> A modern collaborative project management platform focused on real-time teamwork, scalable architecture, and an extensible foundation for intelligent workflow automation.

---

## ✨ Current Features

### ✅ Core Web Application

- Create and manage multiple Kanban boards
- Create columns within boards
- Create, edit, and delete task cards
- Card metadata:
  - Title
  - Description
  - Priority
  - Labels
  - Assignee
- Responsive Kanban interface
- Persistent data storage using MongoDB Atlas

---

### ⚡ Real-Time Collaboration

Powered by **Socket.io**

- Real-time card creation
- Real-time card updates
- Real-time card deletion
- Real-time column creation
- Real-time drag-and-drop synchronization
- Board-specific collaboration using Socket.io Rooms
- Automatic socket cleanup on disconnect
- Duplicate event prevention

---

### 🎯 Drag & Drop

Built using **Dnd Kit**

- Drag cards between columns
- Reorder cards
- Optimistic UI updates
- Smooth Drag Overlay animation
- Ghost effect while dragging
- Real-time synchronization across connected users
- Persistent ordering stored in MongoDB

---

## 📸 Preview

> Screenshots/GIFs coming soon.

- Dashboard
- Real-time collaboration
- Drag & Drop
- Multi-user synchronization

---

## 🏗️ Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- Dnd Kit
- Socket.io Client

### Backend

- Node.js
- Express.js
- Socket.io
- Mongoose
- Node Cron *(planned for future phases)*

### Database

- MongoDB Atlas

### Deployment

- Railway *(planned)*

---

## 🏛️ Architecture Highlights

The application follows a modular, layered architecture designed for scalability and maintainability.

- **Layered Backend Architecture** – Clear separation of routes, controllers, models, and socket management for improved code organization and maintainability.
- **REST + WebSockets** – Express handles persistent CRUD operations while Socket.io provides low-latency, real-time synchronization between connected clients.
- **Board-Based Socket Rooms** – Each Kanban board has its own Socket.io room, ensuring events are only broadcast to users collaborating on the same board.
- **Database as the Source of Truth** – All changes are persisted to MongoDB before being broadcast, ensuring consistency across clients.
- **Optimistic UI Updates** – Drag-and-drop interactions update the interface immediately while persisting changes asynchronously for a smooth user experience.
- **Extensible Foundation** – The project structure is designed to support future features such as AI-powered insights, GitHub issue import, scheduled background jobs, and browser extensions without major architectural changes.

---

## 📂 Project Structure

```text
collaborativeflow-ai/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│
└── server/
    ├── config/
    ├── controllers/
    ├── models/
    ├── routes/
    └── socket/
```

---

## 🔌 API Overview

### Health

| Method | Endpoint |
|---------|----------|
| GET | `/api/health` |

### Boards

| Method | Endpoint |
|---------|----------|
| GET | `/api/boards` |
| POST | `/api/boards` |
| GET | `/api/boards/:boardId` |
| DELETE | `/api/boards/:boardId` |
| POST | `/api/boards/:boardId/columns` |

### Cards

| Method | Endpoint |
|---------|----------|
| POST | `/api/boards/:boardId/cards` |
| PATCH | `/api/cards/:cardId` |
| DELETE | `/api/cards/:cardId` |
| PATCH | `/api/cards/:cardId/move` |

---

## 🔄 Real-Time Collaboration Architecture

The application uses **Socket.io Rooms** to isolate board-specific collaboration.

Workflow:

1. User performs an action.
2. Express validates the request.
3. MongoDB persists the change.
4. Server emits a Socket.io event.
5. All connected users viewing the same board receive the update instantly.

This ensures the database remains the single source of truth while providing seamless real-time collaboration.

---

## 🗄️ Data Models

Current collections:

- Board
- Column
- Card

Planned collections:

- Comment
- ActivityLog
- DigestReport

---

## 🧪 Current Status

### ✅ Completed

- Project setup
- Backend foundation
- MongoDB integration
- Board CRUD
- Column CRUD
- Card CRUD
- Real-time collaboration
- Drag-and-drop
- MongoDB persistence
- Responsive UI

## 🛣️ Product Roadmap

The architecture has been designed to support the following future enhancements:

- AI Project Manager
- GitHub Issues Import
- Weekly Digest Reports
- Chrome Extension
- Team Dashboard
- Activity History
- Comments
- Railway Deployment
- Public Board Sharing

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone <repository-url>
cd collaborativeflow-ai
```

### Install dependencies

Backend

```bash
cd server
npm install
```

Frontend

```bash
cd client
npm install
```

---

### Environment Variables

Create a `.env` file inside the `server` directory.

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
CLIENT_URL=http://localhost:5173
```

---

### Run the application

Backend

```bash
cd server
npm run dev
```

Frontend

```bash
cd client
npm run dev
```

---

## 📌 Design Decisions

- Express + Socket.io share the same HTTP server.
- MongoDB Atlas provides persistent storage.
- Last Write Wins (LWW) selected as the conflict resolution strategy.
- Socket.io Rooms isolate collaboration per board.
- Optimistic UI updates improve drag-and-drop responsiveness.
- REST APIs handle persistence while WebSockets handle synchronization.

---

## 📈 Future Roadmap

- AI-powered Project Manager
- Bottleneck Detection
- Sprint Risk Analysis
- Task Complexity Inference
- GitHub Issues Import
- Chrome Extension
- Weekly Digest Reports
- Team Dashboard
- Railway Deployment
- Public Board Sharing

---

# 👨‍💻 Author

**Srijan Ghosh**

Aspiring Software Engineer focused on building production-ready full-stack applications with modern web technologies and AI-powered user experiences.

---
