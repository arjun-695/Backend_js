import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ListVideo, Trash2, Loader, PlayCircle } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "./Playlists.css";

const Playlists = () => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?._id) {
      fetchPlaylists();
    } else {
      setLoading(false);
      setError("Please log in to view your playlists.");
    }
  }, [user]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/playlists/user/${user._id}`);
      setPlaylists(res.data.data || []);
      setError("");
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
      setError("Failed to load playlists.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async (e, playlistId) => {
    e.preventDefault(); // Prevent navigating to the detail page
    if (!window.confirm("Are you sure you want to delete this playlist?"))
      return;

    try {
      await api.delete(`/playlists/${playlistId}`);
      setPlaylists(playlists.filter((pl) => pl._id !== playlistId));
    } catch (err) {
      console.error("Failed to delete playlist:", err);
      alert("Failed to delete playlist.");
    }
  };

  if (loading) {
    return (
      <div className="playlists-page-centered">
        <Loader className="spinner" size={48} />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="playlists-page-centered">
        <ListVideo size={64} className="text-muted mb-4" />
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div className="playlists-container">
      <div className="page-header">
        <h1>Your Playlists</h1>
        <p>Collections of your favorite videos</p>
      </div>

      {playlists.length > 0 ? (
        <div className="playlist-grid">
          {playlists.map((pl) => (
            <Link
              to={`/playlist/${pl._id}`}
              key={pl._id}
              className="playlist-card glass-panel"
            >
              <div className="playlist-thumbnail-wrapper">
                {pl.videos && pl.videos.length > 0 && pl.videos[0].thumbnail ? (
                  <img
                    src={pl.videos[0].thumbnail}
                    alt={pl.name}
                    className="playlist-cover-img"
                  />
                ) : (
                  <div className="empty-playlist-cover">
                    <ListVideo size={48} className="text-muted" />
                  </div>
                )}
                <div className="playlist-overlay-stats">
                  <ListVideo size={20} />
                  <span>{pl.videos?.length || 0} videos</span>
                </div>

                <div className="playlist-hover-play">
                  <PlayCircle size={48} />
                  <span>Play All</span>
                </div>
              </div>

              <div className="playlist-info">
                <h3>{pl.name}</h3>
                <p className="playlist-desc text-muted">
                  {pl.description || "No description"}
                </p>
                <button
                  className="icon-btn delete-pl-btn"
                  onClick={(e) => handleDeletePlaylist(e, pl._id)}
                  title="Delete Playlist"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state glass-panel">
          <ListVideo size={64} className="text-muted mb-4" />
          <h2>No playlists found</h2>
          <p className="text-muted">
            You haven't created any playlists yet. Save videos to a playlist to
            see them here.
          </p>
        </div>
      )}
    </div>
  );
};

export default Playlists;
