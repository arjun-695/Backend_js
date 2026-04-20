import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  Camera,
  UploadCloud,
} from "lucide-react";
import "./Auth.css";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!avatar) {
      setError("Avatar is required.");
      return;
    }

    setIsLoading(true);

    try {
      const data = new FormData();
      data.append("fullname", formData.fullName);
      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("avatar", avatar);
      if (coverImage) {
        data.append("coverImage", coverImage);
      }

      await register(data);

      // Auto login after successful registration
      await login(formData.email, undefined, formData.password);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card glass-panel">
        <div className="auth-header">
          <div className="brand-logo-large">▶</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join VidSeam today</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Avatar Upload (Circle Trigger) */}
          <div className="avatar-upload-container">
            <div
              className="avatar-preview-circle"
              onClick={() => fileInputRef.current.click()}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  <Camera size={24} />
                  <span>Avatar*</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Full Name</label>
              <input
                name="fullName"
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group flex-1">
              <label>Username</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  name="username"
                  type="text"
                  className="input-field pl-10"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleInputChange}
                  pattern="^[a-zA-Z0-9_\-]+$"
                  title="Alphanumeric with underscores or dashes."
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                name="email"
                type="email"
                className="input-field pl-10"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                name="password"
                type="password"
                className="input-field pl-10"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength="8"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Cover Image (Optional)</label>
            <div
              className="file-upload-box"
              onClick={() => coverInputRef.current.click()}
            >
              <UploadCloud size={24} className="upload-icon" />
              <span className="upload-text">
                {coverImage ? coverImage.name : "Click to select cover banner"}
              </span>
              <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverChange}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary auth-submit"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
