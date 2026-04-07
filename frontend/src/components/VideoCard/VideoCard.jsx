import React from "react";
import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import "./VideoCard.css";

const VideoCard = ({ video }) => {
  // Defensive checks in case data is incomplete
  if (!video) return null;

  const {
    _id,
    title,
    thumbnail,
    views = 0,
    createdAt,
    duration,
    owner,
  } = video;

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="video-card">
      <Link to={`/video/${_id}`} className="thumbnail-container">
        <img
          src={thumbnail?.url || thumbnail}
          alt={title}
          className="video-thumbnail"
          loading="lazy"
        />
        <span className="video-duration">{formatDuration(duration)}</span>
      </Link>

      <div className="video-info">
        <Link
          to={`/channel/${owner?.username}`}
          className="channel-avatar-link"
        >
          <img
            src={owner?.avatar || "https://via.placeholder.com/36"}
            alt={owner?.username || "Channel"}
            className="channel-avatar"
          />
        </Link>

        <div className="video-details">
          <h3 className="video-title">
            <Link to={`/video/${_id}`}>{title}</Link>
          </h3>

          <Link to={`/channel/${owner?.username}`} className="channel-name">
            {owner?.fullName || owner?.username || "Unknown Channel"}
          </Link>

          <div className="video-metadata">
            <span>{views} views</span>
            <span className="metadata-separator">•</span>
            <span>
              {createdAt
                ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
                : "Recently"}
            </span>
          </div>
        </div>

        <button className="icon-btn more-btn">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
};

export default VideoCard;
