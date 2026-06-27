import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

// Home page — will become the board list
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

        {/* Navigation links to test routing */}
        <div className="flex gap-4 justify-center">
          <Link
            to="/boards"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Boards
          </Link>
        </div>
      </div>
    </div>
  );
};

// Boards page — will become the board list
const BoardsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">My Boards</h1>
      <p className="text-gray-500">Boards will appear later</p>
      <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
        ← Back to Home
      </Link>
    </div>
  );
};

// 404error page — shown when no route matches
const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-gray-500 mb-4">Page not found</p>
        <Link to="/" className="text-blue-600 hover:underline">
          Go Home
        </Link>
      </div>
    </div>
  );
};

// ROOT APP COMPONENT
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/boards" element={<BoardsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
