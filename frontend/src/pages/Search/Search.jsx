import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import VideoCard from "../../components/VideoCard/VideoCard";
import { Loader } from "lucide-react";
import "./Search.css";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setVideos([]);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await api.get(
          `/videos?query=${encodeURIComponent(query)}`
        );

        const videoData = response.data.data?.docs || response.data.data || [];
        setVideos(videoData);
      } catch (err) {
        console.error("Failed to fetch search results:", err);
        setError("Unable to load search results.");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <div className="search-container">
      <h2 className="search-heading">
        Search results for: <span className="text-accent">{query}</span>
      </h2>

      {loading ? (
        <div className="search-loading">
          <Loader className="spinner" size={48} />
        </div>
      ) : error ? (
        <div className="search-error">
          <p>{error}</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.length > 0 ? (
            videos.map((video) => <VideoCard key={video._id} video={video} />)
          ) : (
            <div className="no-videos">
              <h3>No videos found</h3>
              <p>Try searching with different keywords.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
