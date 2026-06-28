// Root Application Component
// Sets up React Router and maps URL paths to page components.

import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import BoardsPage from "./pages/BoardsPage";
import BoardPage from "./pages/BoardPage";

// HOME PAGE — kept inline (it's a simple marketing/landing page)
const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          CollaborativeFlow AI
        </h1>
        <p className="text-gray-500 mb-8">
          Real-Time Collaborative Kanban with AI Project Manager
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/boards"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View Boards
          </Link>
        </div>
      </div>
    </div>
  );
};

// 404 PAGE — kept inline (simple, no data needed)
const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-gray-500 mb-4">Page not found</p>
        <Link to="/" className="text-blue-600 hover:underline text-sm">
          Go Home
        </Link>
      </div>
    </div>
  );
};

// ROOT APP
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home — landing page */}
        <Route path="/" element={<HomePage />} />

        {/* Boards list — shows all boards, create board */}
        <Route path="/boards" element={<BoardsPage />} />

        {/* Board detail — the kanban view for one board */}
        {/* :boardId is a URL parameter — read with useParams() in BoardPage */}
        <Route path="/boards/:boardId" element={<BoardPage />} />

        {/* 404 — catches all unmatched URLs */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
