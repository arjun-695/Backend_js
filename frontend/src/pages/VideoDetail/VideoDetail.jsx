import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown, Share2, PlusSquare, Loader } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Comments from "../../components/Comments/Comments";
import PlaylistModal from "../../components/PlaylistModal/PlaylistModal";
import "./VideoDetail.css";

const summarySourceLabels = {
  transcript: "transcript",
  description: "description",
  title: "title",
  empty: "video details",
};

const hasVideoSummary = (summary) =>
  Boolean(summary?.short || summary?.detailed);

const VideoDetail = () => {
  const { videoId } = useParams();
  const { user } = useAuth();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        setLoading(true);
        // Assuming backend has GET /videos/:videoId
        const response = await api.get(`/videos/${videoId}`);
        setVideo(response.data.data);

        // Mock sub count/status if not directly returned in video aggregate
        // Normally this comes from an aggregation in the backend
        setIsSubscribed(response.data.data?.isSubscribed || false);
        setSubscribersCount(response.data.data?.owner?.subscribersCount || 0);

        setIsLiked(response.data.data?.isLiked || false);
        setLikesCount(response.data.data?.totalLikes || 0);
      } catch (err) {
        console.error("Failed to fetch video details:", err);
        setError("Video not found or an error occurred.");
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideoDetails();
    }
  }, [videoId]);

  const handleSubscribeToggle = async () => {
    if (!user) return alert("Please sign in to subscribe.");

    try {
      // Assuming POST /subscriptions/c/:channelId toggles sub
      await api.post(`/subscriptions/c/${video?.owner?._id}`);
      setIsSubscribed(!isSubscribed);
      setSubscribersCount((prev) => (isSubscribed ? prev - 1 : prev + 1));
    } catch (error) {
      console.error("Subscription toggle failed", error);
    }
  };

  const handleLikeToggle = async () => {
    if (!user) return alert("Please sign in to like videos.");

    try {
      await api.post(`/likes/toggle/v/${video._id}`);
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    } catch (error) {
      console.error("Like toggle failed", error);
    }
  };

  if (loading) {
    return (
      <div className="video-detail-loading">
        <Loader className="spinner" size={48} />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="video-detail-error">
        <h2>We're sorry</h2>
        <p>{error}</p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  const summary = video.summary;
  const hasSummary = hasVideoSummary(summary);

  return (
    <div className="video-detail-container">
      <div className="video-main-content">
        <div className="video-player-wrapper">
          <video
            src={video.videoFile?.url || video.videoFile}
            poster={video.thumbnail?.url || video.thumbnail}
            controls
            autoPlay
            className="video-player"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        <h1 className="video-title-large">{video.title}</h1>

        <div className="video-primary-info flex-between flex-wrap">
          <div className="channel-info-block flex-align-center">
            <Link to={`/channel/${video.owner?.username}`}>
              <img
                src={video.owner?.avatar || "https://via.placeholder.com/48"}
                alt={video.owner?.username}
                className="channel-avatar-large"
              />
            </Link>
            <div className="channel-text-info">
              <Link
                to={`/channel/${video.owner?.username}`}
                className="channel-name-large"
              >
                {video.owner?.fullName || video.owner?.username}
              </Link>
              <span className="channel-subs">
                {subscribersCount} subscribers
              </span>
            </div>

            {/* Don't show subscribe button if user owns the video */}
            {user?._id !== video.owner?._id && (
              <button
                className={`subscribe-btn ${isSubscribed ? "subscribed" : "btn-primary"}`}
                onClick={handleSubscribeToggle}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            )}
          </div>

          <div className="video-actions flex-align-center">
            <div
              className={`action-group glass-panel ${isLiked ? "active-like-group" : ""}`}
            >
              <button
                className={`action-btn border-right ${isLiked ? "text-accent" : ""}`}
                title="I like this"
                onClick={handleLikeToggle}
              >
                <ThumbsUp size={20} />
                <span className="action-text">{likesCount}</span>
              </button>
              <button className="action-btn" title="I dislike this">
                <ThumbsDown size={20} />
              </button>
            </div>

            <button className="action-btn-single glass-panel">
              <Share2 size={20} />
              <span className="action-text show-desktop">Share</span>
            </button>

            <button
              className="action-btn-single glass-panel"
              onClick={() => {
                if (user) setShowPlaylistModal(true);
                else alert("Sign in to save videos.");
              }}
            >
              <PlusSquare size={20} />
              <span className="action-text show-desktop">Save</span>
            </button>
          </div>
        </div>

        <div className="video-description-box glass-panel">
          <div className="description-stats">
            <span>{video.views} views</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(video.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <div className="description-text">{video.description}</div>
        </div>

        <section className="video-summary-box glass-panel">
          <div className="video-summary-header">
            <div>
              <p className="summary-kicker">Auto Summary</p>
              <h2 className="summary-title">Quick recap</h2>
            </div>
            <span className="summary-source-badge">
              Based on{" "}
              {summarySourceLabels[summary?.sourceType] || "video details"}
            </span>
          </div>

          {hasSummary ? (
            <>
              {summary?.short && (
                <p className="summary-short-text">{summary.short}</p>
              )}

              {summary?.detailed && (
                <p className="summary-detailed-text">{summary.detailed}</p>
              )}

              {summary?.keyTakeaways?.length > 0 && (
                <div className="summary-takeaways-grid">
                  {summary.keyTakeaways.map((takeaway, index) => (
                    <div
                      key={`${takeaway}-${index}`}
                      className="summary-takeaway-card"
                    >
                      <span className="summary-takeaway-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p>{takeaway}</p>
                    </div>
                  ))}
                </div>
              )}

              {summary?.keywords?.length > 0 && (
                <div className="summary-keywords-row">
                  {summary.keywords.map((keyword) => (
                    <span key={keyword} className="summary-keyword-chip">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="summary-empty-state">
              Add a transcript or richer video notes to generate a sharper
              summary for viewers.
            </p>
          )}
        </section>

        <Comments videoId={video._id} />
      </div>

      <div className="video-sidebar">
        {/* Recommended Videos placeholder */}
        <h3>Up Next</h3>
        <p className="text-muted">Recommended videos will appear here.</p>
      </div>

      <PlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        videoId={video._id}
      />
    </div>
  );
};

export default VideoDetail;
