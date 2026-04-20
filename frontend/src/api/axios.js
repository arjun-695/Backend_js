import axios from "axios";

// Automatically use the correct URL for local development vs Vercel
const API_URL = import.meta.env.PROD ? "/api/v1" : "http://localhost:8000/api/v1";

// Create an instance of axios
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies if we use them for refresh token
});

// Request Interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    // We will store the access token in localStorage for now
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized (Token Expiry)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and it's not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using refresh token in cookies or storage
        // The backend `/users/refreshtoken` endpoint should handle this if configured properly.
        const res = await axios.post(
          `${API_URL}/users/refreshtoken`,
          {},
          {
            withCredentials: true, // send cookies
          }
        );

        const newAccessToken = res.data.data.accessToken;

        // Update local storage
        localStorage.setItem("accessToken", newAccessToken);

        // Update default headers for future requests
        api.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;

        // Retry the original request with new token
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails (e.g., refresh token expired), log out the user
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login"; // Force redirect to login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
