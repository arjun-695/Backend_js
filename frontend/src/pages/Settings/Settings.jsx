import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Loader } from "lucide-react";
import api from "../../api/axios";
import "./Settings.css";

const Settings = () => {
  const { user, login } = useAuth();

  // Account details
  const [fullname, setFullname] = useState(
    user?.fullname || user?.fullName || ""
  );
  const [email, setEmail] = useState(user?.email || "");

  // Password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Feedback
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [avatarMsg, setAvatarMsg] = useState({ type: "", text: "" });
  const [coverMsg, setCoverMsg] = useState({ type: "", text: "" });

  const [saving, setSaving] = useState("");

  const avatarRef = useRef(null);
  const coverRef = useRef(null);

  if (!user) {
    return (
      <div className="settings-loading">
        <Loader className="spinner" size={48} />
      </div>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving("profile");
    setProfileMsg({ type: "", text: "" });
    try {
      await api.patch("/users/update-account", { fullname, email });
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving("password");
    setPasswordMsg({ type: "", text: "" });
    try {
      await api.post("/users/change-password", { oldPassword, newPassword });
      setPasswordMsg({
        type: "success",
        text: "Password changed successfully!",
      });
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change password.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving("avatar");
    setAvatarMsg({ type: "", text: "" });
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await api.patch("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatarMsg({
        type: "success",
        text: "Avatar updated! Refresh to see changes.",
      });
    } catch (err) {
      setAvatarMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update avatar.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving("cover");
    setCoverMsg({ type: "", text: "" });
    try {
      const formData = new FormData();
      formData.append("coverImage", file);
      await api.patch("/users/cover-Image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCoverMsg({
        type: "success",
        text: "Cover image updated! Refresh to see changes.",
      });
    } catch (err) {
      setCoverMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update cover image.",
      });
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="settings-page">
      <h2>Account Settings</h2>

      {/* Profile Section */}
      <div className="settings-section glass-panel">
        <h3>Profile Details</h3>
        <form className="settings-form" onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              className="input-field"
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {profileMsg.text && (
            <p
              className={
                profileMsg.type === "success"
                  ? "settings-success"
                  : "settings-error"
              }
            >
              {profileMsg.text}
            </p>
          )}
          <button
            className="btn-primary"
            type="submit"
            disabled={saving === "profile"}
          >
            {saving === "profile" ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="settings-section glass-panel">
        <h3>Change Password</h3>
        <form className="settings-form" onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              className="input-field"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              className="input-field"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="8"
            />
          </div>
          {passwordMsg.text && (
            <p
              className={
                passwordMsg.type === "success"
                  ? "settings-success"
                  : "settings-error"
              }
            >
              {passwordMsg.text}
            </p>
          )}
          <button
            className="btn-primary"
            type="submit"
            disabled={saving === "password"}
          >
            {saving === "password" ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Avatar Section */}
      <div className="settings-section glass-panel">
        <h3>Profile Picture</h3>
        <div className="avatar-settings-row">
          <img
            src={user.avatar || "https://via.placeholder.com/80"}
            alt="Current avatar"
            className="avatar-settings-preview"
          />
          <div>
            <button
              className="btn-secondary"
              onClick={() => avatarRef.current.click()}
              disabled={saving === "avatar"}
            >
              {saving === "avatar" ? "Uploading..." : "Change Avatar"}
            </button>
            <input
              type="file"
              ref={avatarRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarUpload}
            />
          </div>
        </div>
        {avatarMsg.text && (
          <p
            className={
              avatarMsg.type === "success"
                ? "settings-success"
                : "settings-error"
            }
            style={{ marginTop: "12px" }}
          >
            {avatarMsg.text}
          </p>
        )}
      </div>

      {/* Cover Image Section */}
      <div className="settings-section glass-panel">
        <h3>Cover Image</h3>
        <button
          className="btn-secondary"
          onClick={() => coverRef.current.click()}
          disabled={saving === "cover"}
        >
          {saving === "cover" ? "Uploading..." : "Change Cover Image"}
        </button>
        <input
          type="file"
          ref={coverRef}
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleCoverUpload}
        />
        {coverMsg.text && (
          <p
            className={
              coverMsg.type === "success"
                ? "settings-success"
                : "settings-error"
            }
            style={{ marginTop: "12px" }}
          >
            {coverMsg.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default Settings;
