import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Image as ImageIcon,
  Video,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "./Upload.css";

const UploadVideo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    transcript: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  // If not logged in, should not really be here (protected route), but defensive check
  if (!user) {
    return (
      <div className="upload-container centered">
        <h2>Please log in to upload a video.</h2>
        <button className="btn-primary" onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setError("");
    } else {
      setError("Please select a valid video file.");
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setError("");
    } else {
      setError("Please select a valid image file for thumbnail.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !videoFile ||
      !thumbnailFile ||
      !formData.title.trim() ||
      !formData.description.trim()
    ) {
      setError("All fields and files are required.");
      return;
    }

    setLoading(true);

    try {
      const uploadData = new FormData();
      uploadData.append("title", formData.title);
      uploadData.append("description", formData.description);
      uploadData.append("transcript", formData.transcript);
      uploadData.append("videoFile", videoFile);
      uploadData.append("thumbnail", thumbnailFile);

      // Timeout extended for large uploads if needed by axios config, but usually default is fine unless explicitly blocked
      const response = await api.post("/videos", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        // Optional: onUploadProgress for a progress bar
      });

      setSuccess("Video uploaded successfully!");

      // Redirect to the new video after a short delay
      setTimeout(() => {
        navigate(`/video/${response.data.data._id}`);
      }, 2000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to upload video. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>Upload Video</h1>
        <p>Share your moments with the world</p>
      </div>

      <div className="upload-content">
        <div className="upload-form-wrapper glass-panel">
          {error && (
            <div className="alert-box error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-box success">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="upload-form">
            {/* Split Layout: File Drop Zones & Text Inputs */}
            <div className="upload-split">
              <div className="upload-files-section">
                <div className="form-group">
                  <label>Video File *</label>
                  <div
                    className={`file-drop-zone ${videoFile ? "has-file" : ""}`}
                    onClick={() => videoInputRef.current.click()}
                  >
                    {!videoFile ? (
                      <>
                        <Upload size={32} className="drop-icon" />
                        <p>Click or drag to upload video format</p>
                        <span className="file-hint">MP4, WebM, or OGG</span>
                      </>
                    ) : (
                      <div className="file-selected">
                        <Video size={32} className="text-accent" />
                        <p className="file-name">{videoFile.name}</p>
                        <span className="file-size">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={videoInputRef}
                      onChange={handleVideoChange}
                      accept="video/*"
                      style={{ display: "none" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Thumbnail Image *</label>
                  <div
                    className={`file-drop-zone thumbnail-zone ${thumbnailPreview ? "has-preview" : ""}`}
                    onClick={() => thumbnailInputRef.current.click()}
                  >
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        className="thumbnail-preview-img"
                      />
                    ) : (
                      <>
                        <ImageIcon size={32} className="drop-icon" />
                        <p>Upload a catchy thumbnail</p>
                        <span className="file-hint">JPG, PNG, WEBP</span>
                      </>
                    )}
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      onChange={handleThumbnailChange}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              </div>

              <div className="upload-details-section">
                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    className="input-field"
                    placeholder="Add a title that describes your video"
                    value={formData.title}
                    onChange={handleInputChange}
                    maxLength={100}
                    required
                  />
                  <span className="char-count">
                    {formData.title.length}/100
                  </span>
                </div>

                <div className="form-group flex-grow">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    className="input-field textarea-field"
                    placeholder="Tell viewers about your video"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="transcript">Transcript or Notes</label>
                  <textarea
                    id="transcript"
                    name="transcript"
                    className="input-field transcript-field"
                    placeholder="Optional: paste a transcript, speaking notes, or key moments to improve the auto-generated summary."
                    value={formData.transcript}
                    onChange={handleInputChange}
                  ></textarea>
                  <p className="field-helper">
                    Adding transcript text helps the summary stay closer to what
                    is actually said in the video.
                  </p>
                </div>
              </div>
            </div>

            <div className="upload-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !videoFile || !thumbnailFile}
              >
                {loading ? "Uploading & Publishing..." : "Publish Video"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadVideo;
