import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader, Play, Trash2, Edit3, Save, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import VideoCard from "../../components/VideoCard/VideoCard";
import "./PlaylistDetail.css";

const PlaylistDetail = () => {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    fetchPlaylistDetails();
  }, [playlistId]);

  const fetchPlaylistDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/playlists/${playlistId}`);
      setPlaylist(res.data.data);
    } catch (err) {
      console.error("Failed to fetch playlist", err);
      setError("Playlist not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId) => {
    try {
      await api.patch(`/playlists/remove/${videoId}/${playlistId}`);
      setPlaylist((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => v._id !== videoId),
      }));
    } catch (error) {
      console.error("Failed to remove video from playlist", error);
      alert("Failed to remove video.");
    }
  };

  const handleDeletePlaylist = async () => {
    if (
      !window.confirm("Are you sure you want to delete this entire playlist?")
    )
      return;
    try {
      await api.delete(`/playlists/${playlistId}`);
      navigate("/playlists");
    } catch (err) {
      console.error("Failed to delete playlist", err);
      alert("Failed to delete playlist.");
    }
  };

  const handleStartEdit = () => {
    setEditName(playlist.name);
    setEditDesc(playlist.description || "");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      await api.patch(`/playlists/${playlistId}`, {
        name: editName,
        description: editDesc,
      });
      setPlaylist((prev) => ({
        ...prev,
        name: editName,
        description: editDesc,
      }));
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update playlist", err);
      alert("Failed to update playlist.");
    }
  };

  if (loading)
    return (
      <div className="playlists-page-centered">
        <Loader className="spinner" size={48} />
      </div>
    );
  if (error || !playlist)
    return (
      <div className="playlists-page-centered">
        <h2>{error}</h2>
        <Link to="/playlists" className="btn-primary mt-2">
          Go Back
        </Link>
      </div>
    );

  const isOwner = user?._id === playlist.owner;
  const firstVideo = playlist.videos?.[0];

  return (
    <div className="playlist-detail-container">
      {/* Left Sidebar Info Area */}
      <div className="playlist-detail-info glass-panel">
        <div className="playlist-hero-img">
          {firstVideo?.thumbnail ? (
            <img
              src={firstVideo.thumbnail?.url || firstVideo.thumbnail}
              alt={playlist.name}
            />
          ) : (
            <div className="hero-placeholder">No Videos Yet</div>
          )}
        </div>

        <div className="playlist-text-content">
          {isEditing ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <input
                className="input-field"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Playlist name"
              />
              <textarea
                className="input-field"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description"
                rows={3}
                style={{ resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn-primary" onClick={handleSaveEdit}>
                  <Save size={16} /> Save
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="playlist-title-main">{playlist.name}</h1>
              <p className="playlist-desc-main">{playlist.description}</p>
            </>
          )}

          <div className="playlist-stats">
            <span>{playlist.videos?.length || 0} videos</span>
            <span>•</span>
            <span>
              Updated{" "}
              {formatDistanceToNow(
                new Date(playlist.updatedAt || playlist.createdAt),
                { addSuffix: true }
              )}
            </span>
          </div>

          <div className="playlist-actions-main">
            <Link
              to={firstVideo ? `/video/${firstVideo._id}` : "#"}
              className={`btn-primary play-all-btn ${!firstVideo ? "disabled" : ""}`}
              onClick={(e) => !firstVideo && e.preventDefault()}
            >
              <Play size={20} fill="currentColor" />
              Play All
            </Link>

            {isOwner && !isEditing && (
              <>
                <button className="btn-secondary" onClick={handleStartEdit}>
                  <Edit3 size={16} /> Edit
                </button>
                <button
                  className="btn-secondary text-danger"
                  onClick={handleDeletePlaylist}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Video Feed Area */}
      <div className="playlist-detail-feed">
        {playlist.videos && playlist.videos.length > 0 ? (
          <div className="playlist-video-list">
            {playlist.videos.map((video, idx) => (
              <div key={video._id} className="playlist-video-row display-flex">
                <div className="video-index text-muted">{idx + 1}</div>
                <div className="video-card-wrapper">
                  <VideoCard video={video} />
                </div>
                {isOwner && (
                  <button
                    className="icon-btn remove-video-btn"
                    onClick={() => handleRemoveVideo(video._id)}
                    title="Remove from playlist"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>This playlist is currently empty.</h3>
            <p className="text-muted">
              Start saving your favorite videos to see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;
