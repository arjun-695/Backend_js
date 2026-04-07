import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader } from "lucide-react";
import api from "../../api/axios";
import VideoCard from "../../components/VideoCard/VideoCard";
import "../Home/Home.css";

const LikedVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLikedVideos = async () => {
      try {
        setLoading(true);
        const res = await api.get("/likes/videos");
        // Backend returns { likedVideos: [...] } where each item has videoDetails
        const likedData = res.data.data?.likedVideos || [];
        // Normalize: each item has videoDetails containing the video info
        const normalized = likedData
          .map((item) => item.videoDetails)
          .filter(Boolean);
        setVideos(normalized);
      } catch (err) {
        console.error("Failed to fetch liked videos:", err);
        setError("Unable to load liked videos.");
      } finally {
        setLoading(false);
      }
    };
    fetchLikedVideos();
  }, []);

  if (loading) {
    return (
      <div className="home-loading">
        <Loader className="spinner" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-error">
        <h2>Oops!</h2>
        <p>{error}</p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="home-container">
      <h2 style={{ marginBottom: "24px" }}>Liked Videos</h2>
      <div className="video-grid">
        {videos.length > 0 ? (
          videos.map((video) => <VideoCard key={video._id} video={video} />)
        ) : (
          <div className="no-videos">
            <h3>No liked videos yet</h3>
            <p>Videos you like will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedVideos;
