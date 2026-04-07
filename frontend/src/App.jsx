import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Home from "./pages/Home/Home";
import UploadVideo from "./pages/Upload/UploadVideo";
import VideoDetail from "./pages/VideoDetail/VideoDetail";
import Playlists from "./pages/Playlists/Playlists";
import PlaylistDetail from "./pages/PlaylistDetail/PlaylistDetail";
import SearchPage from "./pages/Search/Search";
import Channel from "./pages/Channel/Channel";
import History from "./pages/History/History";
import LikedVideos from "./pages/LikedVideos/LikedVideos";
import Subscriptions from "./pages/Subscriptions/Subscriptions";
import Settings from "./pages/Settings/Settings";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar toggleSidebar={toggleSidebar} />

          <main className="main-content">
            <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

            <div className="page-wrapper">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/upload" element={<UploadVideo />} />
                <Route path="/video/:videoId" element={<VideoDetail />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route
                  path="/playlist/:playlistId"
                  element={<PlaylistDetail />}
                />
                <Route path="/channel/:username" element={<Channel />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/history" element={<History />} />
                <Route path="/liked" element={<LikedVideos />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<h2>404 Not Found</h2>} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
