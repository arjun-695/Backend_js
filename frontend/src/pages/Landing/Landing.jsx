import React from "react";
import { Link } from "react-router-dom";
import { Play, TrendingUp, Users, Video } from "lucide-react";
import "./Landing.css";

const Landing = () => {
  return (
    <div className="landing-container">
      {/* Dynamic Animated Background */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <nav className="landing-nav">
        <div className="logo">
          <Video className="logo-icon" />
          <span>VidSeam</span>
        </div>
        <div className="nav-links">
          <Link to="/login" className="btn-login">Log In</Link>
          <Link to="/register" className="btn-signup">Sign Up</Link>
        </div>
      </nav>

      <main className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Stream Your Future <br />
            <span className="text-gradient">Without Limits</span>
          </h1>
          <p className="hero-subtitle">
            Experience the next generation of video sharing. High-quality streams, 
            lightning-fast delivery, and a community that creates together.
          </p>
          <div className="hero-actions">
            <Link to="/home" className="btn-primary-large">
              <Play className="icon-play" fill="currentColor" />
              Start Watching
            </Link>
            <Link to="/register" className="btn-secondary-large">
              Become a Creator
            </Link>
          </div>
        </div>

        {/* Floating Glassmorphic Cards with SVGs */}
        <div className="hero-visuals">
          <div className="floating-card card-1">
            <div className="card-icon-wrapper blue">
              <TrendingUp size={28} />
            </div>
            <div className="card-text">
              <h4>Trending Now</h4>
              <p>Top global content</p>
            </div>
          </div>
          
          <div className="floating-card card-2">
            <div className="card-icon-wrapper purple">
              <Users size={28} />
            </div>
            <div className="card-text">
              <h4>1M+ Creators</h4>
              <p>Join the community</p>
            </div>
          </div>

          <div className="hero-main-svg">
            {/* Dynamic SVG specific to video streaming */}
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="animated-blob">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <path fill="url(#gradient)" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.1,-46.3C90.4,-33.5,96.1,-18,95.5,-2.9C94.9,12.2,88.1,26.9,78.2,38.9C68.3,50.9,55.3,60.1,41.9,67.6C28.4,75.1,14.2,80.9,-0.4,81.6C-15,82.3,-30.1,77.9,-43.3,70.1C-56.5,62.3,-67.9,51.1,-75.7,37.8C-83.6,24.5,-87.8,9.1,-86.6,-5.8C-85.4,-20.6,-78.7,-34.9,-69.5,-46.8C-60.2,-58.6,-48.5,-68.1,-35.1,-75.4C-21.6,-82.7,-6.6,-87.8,7.9,-84.9C22.4,-82,44.7,-76.4,44.7,-76.4Z" transform="translate(100 100) scale(1.1)" />
              <circle cx="100" cy="100" r="30" fill="rgba(255,255,255,0.2)" className="play-pulse" />
              <polygon points="90,85 120,100 90,115" fill="#ffffff" />
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
