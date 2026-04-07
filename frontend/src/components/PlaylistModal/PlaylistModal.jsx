import React, { useState, useEffect } from "react";
import { X, Plus, Check, Loader } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "./PlaylistModal.css";

const PlaylistModal = ({ isOpen, onClose, videoId }) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ name: "", description: "" });
  const [isCreating, setIsCreating] = useState(false);

  // To track which playlists contain this video
  const [savingStatus, setSavingStatus] = useState({});

  useEffect(() => {
    if (isOpen && user?._id) {
      fetchUserPlaylists();
    }
  }, [isOpen, user]);

  const fetchUserPlaylists = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/playlists/user/${user._id}`);
      const fetchedData = res.data.data || [];
      setPlaylists(fetchedData);

      // Check which playlists have the video already
      const initialStatus = {};
      fetchedData.forEach((pl) => {
        // Assuming playlist aggregate populates videos array or returns video ids
        const hasVideo = pl.videos?.some(
          (v) => v._id === videoId || v === videoId
        );
        initialStatus[pl._id] = hasVideo;
      });
      setSavingStatus(initialStatus);
    } catch (error) {
      console.error("Failed to fetch user playlists", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylist.name.trim()) return;

    try {
      setIsCreating(true);
      const res = await api.post("/playlists", {
        name: newPlaylist.name,
        description: newPlaylist.description,
      });

      const created = res.data.data;
      setPlaylists([created, ...playlists]);
      setShowCreate(false);
      setNewPlaylist({ name: "", description: "" });

      // Auto-add video to newly created playlist
      await handleToggleVideo(created._id, false);
    } catch (error) {
      console.error("Failed to create playlist", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleVideo = async (playlistId, currentlySaved) => {
    try {
      setSavingStatus((prev) => ({ ...prev, [playlistId]: "loading" }));

      if (currentlySaved) {
        await api.patch(`/playlists/remove/${videoId}/${playlistId}`);
        setSavingStatus((prev) => ({ ...prev, [playlistId]: false }));
      } else {
        await api.patch(`/playlists/add/${videoId}/${playlistId}`);
        setSavingStatus((prev) => ({ ...prev, [playlistId]: true }));
      }
    } catch (err) {
      console.error("Failed to toggle playlist status", err);
      // Revert status on failure
      setSavingStatus((prev) => ({ ...prev, [playlistId]: currentlySaved }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Save to Playlist</h3>
          <button className="icon-btn close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <Loader className="spinner" size={32} />
            </div>
          ) : (
            <div className="playlist-list custom-scrollbar">
              {playlists.length > 0 ? (
                playlists.map((pl) => (
                  <label key={pl._id} className="playlist-item-checkbox">
                    <input
                      type="checkbox"
                      checked={savingStatus[pl._id] === true}
                      disabled={savingStatus[pl._id] === "loading"}
                      onChange={() =>
                        handleToggleVideo(pl._id, savingStatus[pl._id] === true)
                      }
                    />
                    <span className="checkbox-custom">
                      {savingStatus[pl._id] === true && <Check size={14} />}
                    </span>
                    <span className="playlist-name-label">{pl.name}</span>
                    {savingStatus[pl._id] === "loading" && (
                      <Loader size={12} className="spinner ml-auto" />
                    )}
                  </label>
                ))
              ) : (
                <p className="empty-text">You don't have any playlists yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!showCreate ? (
            <button
              className="create-init-btn"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={18} />
              <span>Create new playlist</span>
            </button>
          ) : (
            <form
              onSubmit={handleCreatePlaylist}
              className="create-playlist-form"
            >
              <div className="form-group">
                <input
                  type="text"
                  className="input-field slim-input"
                  placeholder="Playlist Name"
                  value={newPlaylist.name}
                  onChange={(e) =>
                    setNewPlaylist({ ...newPlaylist, name: e.target.value })
                  }
                  required
                  maxLength={50}
                  autoFocus
                />
              </div>
              <div className="form-action-btns">
                <button
                  type="button"
                  className="action-text-btn cancel"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-text-btn create"
                  disabled={!newPlaylist.name.trim() || isCreating}
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistModal;
