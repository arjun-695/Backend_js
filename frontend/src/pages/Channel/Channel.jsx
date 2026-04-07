import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Loader,
  Trash2,
  Eye,
  EyeOff,
  Edit3,
  Settings,
  Upload,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import VideoCard from "../../components/VideoCard/VideoCard";
import "./Channel.css";

const Channel = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("videos");

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        setLoading(true);
        const channelRes = await api.get(`/users/c/${username}`);
        const channelData = channelRes.data.data;
        setChannel(channelData);
        setIsSubscribed(channelData.isSubscribed || false);
        setSubscribersCount(channelData.subscribersCount || 0);

        const videosRes = await api.get(
          `/videos?userId=${channelData._id}&sortBy=createdAt&sortType=desc`
        );
        const videoData =
          videosRes.data.data?.docs || videosRes.data.data || [];
        setVideos(videoData);
      } catch (err) {
        console.error("Failed to fetch channel:", err);
        setError("Channel not found or an error occurred.");
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchChannel();
  }, [username]);

  const handleSubscribeToggle = async () => {
    if (!user) return alert("Please sign in to subscribe.");
    try {
      await api.post(`/subscriptions/c/${channel._id}`);
      setIsSubscribed(!isSubscribed);
      setSubscribersCount((prev) => (isSubscribed ? prev - 1 : prev + 1));
    } catch (err) {
      console.error("Subscribe toggle failed", err);
    }
  };

  const handleDeleteVideo = async (e, videoId) => {
    e.stopPropagation();
    e.preventDefault();
    if (
      !window.confirm(
        "Are you sure you want to delete this video? This action cannot be undone."
      )
    )
      return;
    try {
      await api.delete(`/videos/${videoId}`);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch (err) {
      console.error("Failed to delete video", err);
      alert(
        "Failed to delete video: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleTogglePublish = async (e, videoId, currentStatus) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await api.patch(`/videos/toggle/publish/${videoId}`);
      setVideos((prev) =>
        prev.map((v) =>
          v._id === videoId ? { ...v, isPublished: !currentStatus } : v
        )
      );
    } catch (err) {
      console.error("Failed to toggle publish status", err);
      alert(
        "Failed to update publish status: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  if (loading) {
    return (
      <div className="channel-loading">
        <Loader className="spinner" size={48} />
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="channel-error">
        <h2>Oops!</h2>
        <p>{error}</p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  const isOwner = user?._id === channel._id;

  return (
    <div className="channel-page">
      {/* Cover Banner */}
      <div className="channel-cover-banner">
        {channel.coverImage && (
          <img src={channel.coverImage} alt={`${channel.fullname}'s banner`} />
        )}
      </div>

      {/* Channel Header */}
      <div className="channel-header">
        <img
          src={channel.avatar || "https://via.placeholder.com/120"}
          alt={channel.username}
          className="channel-avatar-xl"
        />
        <div className="channel-meta">
          <h1 className="channel-display-name">
            {channel.fullname || channel.username}
          </h1>
          <p className="channel-handle">@{channel.username}</p>
          <div className="channel-stats-row">
            <span>{subscribersCount} subscribers</span>
            <span>•</span>
            <span>{videos.length} videos</span>
          </div>
        </div>

        <div className="channel-header-actions">
          {isOwner ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-primary"
                onClick={() => navigate("/upload")}
              >
                <Upload size={18} />
                Upload
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate("/settings")}
              >
                <Settings size={18} />
                Settings
              </button>
            </div>
          ) : (
            <button
              className={`subscribe-btn ${isSubscribed ? "subscribed" : "btn-primary"}`}
              onClick={handleSubscribeToggle}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="channel-tabs">
        <button
          className={`channel-tab ${activeTab === "videos" ? "active" : ""}`}
          onClick={() => setActiveTab("videos")}
        >
          Videos
        </button>
        <button
          className={`channel-tab ${activeTab === "about" ? "active" : ""}`}
          onClick={() => setActiveTab("about")}
        >
          About
        </button>
      </div>

      {/* Videos Tab */}
      {activeTab === "videos" && (
        <div className="video-grid">
          {videos.length > 0 ? (
            videos.map((video) => (
              <div key={video._id} className="channel-video-item">
                <VideoCard video={video} />
                {isOwner && (
                  <div className="owner-video-actions">
                    <span
                      className={`publish-badge ${video.isPublished ? "published" : "draft"}`}
                    >
                      {video.isPublished ? "Published" : "Draft"}
                    </span>
                    <button
                      className="icon-btn-small"
                      title={
                        video.isPublished ? "Archive (unpublish)" : "Publish"
                      }
                      onClick={(e) =>
                        handleTogglePublish(e, video._id, video.isPublished)
                      }
                    >
                      {video.isPublished ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                    <button
                      className="icon-btn-small text-danger"
                      title="Delete video"
                      onClick={(e) => handleDeleteVideo(e, video._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-videos">
              <h3>No videos uploaded yet</h3>
              <p>
                {isOwner
                  ? "Start uploading your first video!"
                  : "This channel hasn't uploaded any videos yet."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* About Tab */}
      {activeTab === "about" && (
        <div
          className="glass-panel"
          style={{ padding: "24px", borderRadius: "var(--radius-md)" }}
        >
          <h3>About {channel.fullname || channel.username}</h3>
          <p className="text-muted" style={{ marginTop: "12px" }}>
            @{channel.username} • {channel.email}
          </p>
          <p className="text-muted" style={{ marginTop: "8px" }}>
            {subscribersCount} subscribers •{" "}
            {channel.channelIsSubscribedToCount || 0} subscriptions
          </p>
        </div>
      )}
    </div>
  );
};

export default Channel;
