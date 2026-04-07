import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Compass,
  Clock,
  ThumbsUp,
  FolderHeart,
  History,
  ListVideo,
  LogIn,
} from "lucide-react";
import "./Sidebar.css";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { user } = useAuth();

  const navItems = [
    { name: "Home", path: "/", icon: Home, requiresAuth: false },
    { name: "History", path: "/history", icon: History, requiresAuth: true },
    {
      name: "Liked Videos",
      path: "/liked",
      icon: ThumbsUp,
      requiresAuth: true,
    },
    {
      name: "Playlists",
      path: "/playlists",
      icon: FolderHeart,
      requiresAuth: true,
    },
    {
      name: "Subscriptions",
      path: "/subscriptions",
      icon: ListVideo,
      requiresAuth: true,
    },
  ];

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={closeSidebar}
      ></div>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            // If item requires auth and user is not logged in, don't show it (or show it differently)
            if (item.requiresAuth && !user) return null;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                onClick={() => {
                  closeSidebar();
                }}
              >
                <item.icon className="nav-icon" size={22} />
                <span className="nav-text">{item.name}</span>
              </NavLink>
            );
          })}

          {!user && (
            <div className="sidebar-auth-prompt">
              <p>Sign in to like videos, comment, and subscribe.</p>
              <NavLink
                to="/login"
                className="btn-secondary sign-in-btn"
                onClick={closeSidebar}
              >
                <LogIn size={18} />
                Sign In
              </NavLink>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
