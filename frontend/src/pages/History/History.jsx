import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader } from "lucide-react";
import api from "../../api/axios";
import VideoCard from "../../components/VideoCard/VideoCard";
import "../Home/Home.css";

const History = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get("/users/history");
        setVideos(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch watch history:", err);
        setError("Unable to load watch history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
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
      <h2 style={{ marginBottom: "24px" }}>Watch History</h2>
      <div className="video-grid">
        {videos.length > 0 ? (
          videos.map((video) => <VideoCard key={video._id} video={video} />)
        ) : (
          <div className="no-videos">
            <h3>No watch history yet</h3>
            <p>Videos you watch will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
