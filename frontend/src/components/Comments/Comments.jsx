import React, { useEffect, useState } from "react";
import { Send, Trash2, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "./Comments.css";

const EMPTY_SENTIMENT_OVERVIEW = {
  totalComments: 0,
  breakdown: {
    positive: 0,
    neutral: 0,
    negative: 0,
  },
  averageScore: 0,
  dominantSentiment: "neutral",
  trendingTerms: {
    positive: [],
    negative: [],
  },
  highlights: {
    mostPositive: null,
    mostNegative: null,
  },
};

const sentimentLabelMap = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

const buildMoodCopy = (overview) => {
  if (!overview || overview.totalComments === 0) {
    return "Comment sentiment will appear once viewers start the conversation.";
  }

  if (overview.dominantSentiment === "positive") {
    return "Viewers are responding positively overall.";
  }

  if (overview.dominantSentiment === "negative") {
    return "The current comment thread is leaning critical.";
  }

  return "The current discussion is fairly mixed and balanced.";
};

const formatSentimentScore = (score = 0) =>
  score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2);

const Comments = ({ videoId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sentimentOverview, setSentimentOverview] = useState(
    EMPTY_SENTIMENT_OVERVIEW
  );

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const fetchComments = async () => {
    if (!videoId) return;

    try {
      setLoading(true);
      const res = await api.get(`/comments/${videoId}`);
      const payload = res.data.data;
      const fetchedComments = payload?.docs || payload || [];
      const normalized = fetchedComments.map((comment) => ({
        ...comment,
        owner: comment.ownerDetails || comment.owner,
        sentiment: comment.sentiment || {
          label: "neutral",
          score: 0,
          confidence: 0,
          positiveTerms: [],
          negativeTerms: [],
        },
      }));

      setComments(normalized);
      setSentimentOverview(
        payload?.sentimentOverview || EMPTY_SENTIMENT_OVERVIEW
      );
    } catch (error) {
      console.error("Failed to fetch comments", error);
      setSentimentOverview(EMPTY_SENTIMENT_OVERVIEW);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      setSubmitting(true);
      await api.post(`/comments/${videoId}`, {
        content: newComment,
      });

      await fetchComments();
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment", error);
      alert("Failed to add comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await api.delete(`/comments/c/${commentId}`);
      await fetchComments();
    } catch (error) {
      console.error("Failed to delete comment", error);
    }
  };

  const handleLikeComment = async (commentId, isLikedCurrently) => {
    if (!user) return alert("Please sign in to like comments.");

    try {
      await api.post(`/likes/toggle/c/${commentId}`);

      setComments((previousComments) =>
        previousComments.map((comment) => {
          if (comment._id !== commentId) {
            return comment;
          }

          return {
            ...comment,
            isLiked: !isLikedCurrently,
            likesCount: isLikedCurrently
              ? Math.max((comment.likesCount || 1) - 1, 0)
              : (comment.likesCount || 0) + 1,
          };
        })
      );
    } catch (error) {
      console.error("Failed to toggle comment like", error);
    }
  };

  return (
    <div className="comments-section">
      <h3>{sentimentOverview.totalComments || comments.length} Comments</h3>

      {user ? (
        <form onSubmit={handleAddComment} className="comment-form">
          <img
            src={user.avatar || "https://via.placeholder.com/40"}
            alt="You"
            className="comment-avatar"
          />
          <div className="comment-input-wrapper">
            <input
              type="text"
              className="comment-input"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
            />
            {newComment.trim() && (
              <button
                type="submit"
                className="icon-btn send-btn"
                disabled={submitting}
              >
                <Send size={18} />
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="auth-prompt-alert glass-panel">
          <p>Please sign in to add a comment.</p>
        </div>
      )}

      <div className="comment-sentiment-panel glass-panel">
        <div className="comment-sentiment-header">
          <div>
            <p className="comment-sentiment-kicker">Sentiment analyzer</p>
            <h4>Community mood</h4>
          </div>
          <span
            className={`comment-sentiment-pill ${sentimentOverview.dominantSentiment}`}
          >
            {sentimentLabelMap[sentimentOverview.dominantSentiment]}
          </span>
        </div>

        <p className="comment-sentiment-copy">
          {buildMoodCopy(sentimentOverview)}
        </p>

        <div className="comment-sentiment-stats">
          <div className="sentiment-stat-card">
            <strong>{sentimentOverview.breakdown.positive}</strong>
            <span>Positive</span>
          </div>
          <div className="sentiment-stat-card">
            <strong>{sentimentOverview.breakdown.neutral}</strong>
            <span>Neutral</span>
          </div>
          <div className="sentiment-stat-card">
            <strong>{sentimentOverview.breakdown.negative}</strong>
            <span>Negative</span>
          </div>
          <div className="sentiment-stat-card">
            <strong>
              {formatSentimentScore(sentimentOverview.averageScore)}
            </strong>
            <span>Average score</span>
          </div>
        </div>

        {(sentimentOverview.trendingTerms?.positive?.length > 0 ||
          sentimentOverview.trendingTerms?.negative?.length > 0) && (
          <div className="sentiment-term-groups">
            {sentimentOverview.trendingTerms?.positive?.length > 0 && (
              <div className="sentiment-term-row">
                <span className="sentiment-term-label">Positive themes</span>
                <div className="sentiment-term-list">
                  {sentimentOverview.trendingTerms.positive.map((term) => (
                    <span
                      key={`positive-${term}`}
                      className="sentiment-term-chip positive"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sentimentOverview.trendingTerms?.negative?.length > 0 && (
              <div className="sentiment-term-row">
                <span className="sentiment-term-label">Critical themes</span>
                <div className="sentiment-term-list">
                  {sentimentOverview.trendingTerms.negative.map((term) => (
                    <span
                      key={`negative-${term}`}
                      className="sentiment-term-chip negative"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-muted mt-2">Loading comments...</p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => {
            const commentTerms = [
              ...(comment.sentiment?.positiveTerms || []),
              ...(comment.sentiment?.negativeTerms || []),
            ].slice(0, 3);

            return (
              <div key={comment._id} className="comment-item">
                <img
                  src={
                    comment.owner?.avatar || "https://via.placeholder.com/40"
                  }
                  alt={comment.owner?.username}
                  className="comment-avatar"
                />
                <div className="comment-content-block">
                  <div className="comment-header">
                    <span className="comment-author">
                      {comment.owner?.fullName ||
                        comment.owner?.fullname ||
                        comment.owner?.username}
                    </span>
                    <span className="comment-time">
                      {comment.createdAt
                        ? formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })
                        : ""}
                    </span>
                    <span
                      className={`comment-sentiment-badge ${comment.sentiment?.label || "neutral"}`}
                    >
                      {sentimentLabelMap[comment.sentiment?.label || "neutral"]}
                    </span>
                  </div>
                  <p className="comment-text">{comment.content}</p>

                  {commentTerms.length > 0 && (
                    <div className="comment-sentiment-terms">
                      {commentTerms.map((term) => (
                        <span
                          key={`${comment._id}-${term}`}
                          className="comment-term-chip"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="comment-actions">
                    <button
                      className={`comment-action-btn ${comment.isLiked ? "liked" : ""}`}
                      onClick={() =>
                        handleLikeComment(comment._id, comment.isLiked)
                      }
                    >
                      <ThumbsUp size={14} />
                      <span>{comment.likesCount || 0}</span>
                    </button>

                    <span className="comment-score-text">
                      Score{" "}
                      {formatSentimentScore(comment.sentiment?.score || 0)}
                    </span>

                    {user?._id === comment.owner?._id && (
                      <button
                        className="comment-action-btn delete-btn"
                        onClick={() => handleDeleteComment(comment._id)}
                        title="Delete Comment"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {comments.length === 0 && (
            <p className="no-comments-msg">
              No comments yet. Be the first to start the conversation!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Comments;
