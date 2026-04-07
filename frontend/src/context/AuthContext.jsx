import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("accessToken");
      if (storedToken) {
        try {
          // Fetch current user details
          const response = await api.get("/users/current-user");
          setUser(response.data.data);
        } catch (error) {
          console.error("Initial auth check failed:", error);
          // Token might be invalid/expired, interceptor handles refresh. If it fails, user is cleared.
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, username, password) => {
    setLoading(true);
    try {
      const payload = password ? { email, username, password } : email; // handle either signature
      const response = await api.post("/users/login", payload);
      const { user: userData, accessToken, refreshToken } = response.data.data;

      localStorage.setItem("accessToken", accessToken);
      // refreshToken is usually handled via httpOnly cookies by the backend,
      // but if it returned it, we could manage it here. Assuming HTTPOnly cookie for refresh token.

      setUser(userData);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      // formData is MultiPart/form-data for avatars
      const response = await api.post("/users/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/users/logout");
    } catch (error) {
      console.error("Logout failed on server", error);
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
