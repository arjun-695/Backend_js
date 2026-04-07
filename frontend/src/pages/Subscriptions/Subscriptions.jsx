import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "./Subscriptions.css";

const Subscriptions = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/subscriptions/u/${user._id}`);
        setChannels(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch subscriptions:", err);
        setError("Unable to load your subscriptions.");
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchSubscriptions();
  }, [user]);

  if (loading) {
    return (
      <div className="subs-loading">
        <Loader className="spinner" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="subs-error">
        <h2>Oops!</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="subscriptions-page">
      <h2>Your Subscriptions</h2>
      <div className="subs-grid">
        {channels.length > 0 ? (
          channels.map((sub) => {
            const ch = sub.channel || sub;
            return (
              <Link
                to={`/channel/${ch.username}`}
                key={ch._id}
                className="sub-card glass-panel"
              >
                <img
                  src={ch.avatar || "https://via.placeholder.com/80"}
                  alt={ch.username}
                  className="sub-avatar"
                />
                <div className="sub-info">
                  <h4>{ch.fullname || ch.username}</h4>
                  <p className="text-muted">@{ch.username}</p>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="no-videos">
            <h3>No subscriptions yet</h3>
            <p>Channels you subscribe to will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;
