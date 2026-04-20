import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Upload,
  Bell,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import "./Navbar.css";
import { useAuth } from "../../context/AuthContext";

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setShowDropdown(false);
  };

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-left">
        <button className="icon-btn menu-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <Link to="/" className="brand-link">
          <div className="brand-logo">▶</div>
          <span className="brand-name gradient-text">VidSeam</span>
        </Link>
      </div>

      <div className="navbar-center">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn">
            <Search size={20} />
          </button>
        </form>
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            <Link
              to="/upload"
              className="icon-btn upload-btn hide-mobile"
              title="Upload Video"
            >
              <Upload size={22} />
            </Link>
            <button className="icon-btn hide-mobile">
              <Bell size={22} />
            </button>
            <div className="profile-menu">
              <img
                src={user.avatar || "https://via.placeholder.com/40"}
                alt={user.username}
                className="user-avatar"
                onClick={() => setShowDropdown(!showDropdown)}
              />

              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user.fullName}</p>
                    <p className="dropdown-username">@{user.username}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link
                    to={`/channel/${user.username}`}
                    className="dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    <UserIcon size={18} />
                    My Channel
                  </Link>
                  <Link
                    to="/settings"
                    className="dropdown-item"
                    onClick={() => setShowDropdown(false)}
                  >
                    <UserIcon size={18} />
                    Settings
                  </Link>
                  <Link
                    to="/upload"
                    className="dropdown-item show-mobile"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Upload size={18} />
                    Upload Video
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button
                    onClick={handleLogout}
                    className="dropdown-item text-danger"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="btn-primary login-btn">
            <UserIcon size={18} />
            <span className="hide-mobile">Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
