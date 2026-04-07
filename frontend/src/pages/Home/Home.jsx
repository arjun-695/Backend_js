import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import VideoCard from "../../components/VideoCard/VideoCard";
import { Loader } from "lucide-react";
import "./Home.css";

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        // Backend GET /videos is optimized with Redis cache
        const response = await api.get("/videos");

        // Extracting data structure based on the likely backend response format
        // The backend returns a paginated list typically (e.g. data.docs or just data)
        const videoData = response.data.data?.docs || response.data.data || [];
        setVideos(videoData);
      } catch (err) {
        console.error("Failed to fetch videos:", err);
        setError("Unable to load videos. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
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
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Optional: Categories/Tags horizontal scroll filter */}
      <div className="categories-filter hide-scrollbar">
        {[
          "All",
          "Gaming",
          "Music",
          "React Router",
          "Node.js",
          "Podcasts",
          "Live",
          "Vlogs",
          "Coding",
        ].map((tag) => (
          <button key={tag} className="category-btn">
            {tag}
          </button>
        ))}
      </div>

      <div className="video-grid">
        {videos.length > 0 ? (
          videos.map((video) => <VideoCard key={video._id} video={video} />)
        ) : (
          <div className="no-videos">
            <h3>No videos found</h3>
            <p>Be the first to upload a video!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
