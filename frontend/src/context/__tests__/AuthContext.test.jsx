import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { AuthProvider, useAuth } from "../AuthContext";
import api from "../../api/axios";

// Mock the axios API module completely
vi.mock("../../api/axios");

// A simple test component to consume the AuthContext
const TestConsumer = () => {
  const { user, login, logout, loading } = useAuth();

  if (loading) return <div>Loading Auth...</div>;

  return (
    <div>
      <div data-testid="user-status">{user ? "Logged In" : "Logged Out"}</div>
      {user && <div data-testid="user-name">{user.fullName}</div>}
      <button onClick={() => login("test@test.com", "testuser", "password123")}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const renderWithAuth = () => {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <TestConsumer />
      </MemoryRouter>
    </AuthProvider>
  );
};

describe("AuthContext Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("initializes with no user when no token exists", async () => {
    renderWithAuth();

    // Wait for the initial loading effect to finish
    await waitFor(() => {
      expect(screen.getByTestId("user-status")).toHaveTextContent("Logged Out");
    });

    // API shouldn't be called if there's no token in localStorage
    expect(api.get).not.toHaveBeenCalled();
  });

  test("fetches user details if token exists on mount", async () => {
    localStorage.setItem("accessToken", "fake-jwt-token");

    const mockUser = { fullName: "Jane Doe", username: "janedoe" };
    api.get.mockResolvedValueOnce({ data: { data: mockUser } });

    renderWithAuth();

    expect(screen.getByText("Loading Auth...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("user-status")).toHaveTextContent("Logged In");
      expect(screen.getByTestId("user-name")).toHaveTextContent("Jane Doe");
    });

    expect(api.get).toHaveBeenCalledWith("/users/current-user");
  });

  test("login function updates state and localStorage successfully", async () => {
    const mockLoginResponse = {
      data: {
        data: {
          user: { fullName: "Test User" },
          accessToken: "new-jwt-token",
        },
      },
    };

    api.post.mockResolvedValueOnce(mockLoginResponse);

    renderWithAuth();

    // Wait for init load
    await waitFor(() => {
      expect(screen.queryByText("Loading Auth...")).not.toBeInTheDocument();
    });

    const loginBtn = screen.getByText("Login");

    await act(async () => {
      await userEvent.click(loginBtn);
    });

    expect(api.post).toHaveBeenCalledWith("/users/login", {
      email: "test@test.com",
      username: "testuser",
      password: "password123",
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-status")).toHaveTextContent("Logged In");
      expect(localStorage.getItem("accessToken")).toBe("new-jwt-token");
    });
  });

  test("logout function clears state and storage", async () => {
    // Setup initial state with a logged-in user
    localStorage.setItem("accessToken", "existing-token");
    api.get.mockResolvedValueOnce({ data: { data: { fullName: "Jane Doe" } } });
    api.post.mockResolvedValueOnce({}); // Mock successful logout API call

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("user-status")).toHaveTextContent("Logged In");
    });

    const logoutBtn = screen.getByText("Logout");

    await act(async () => {
      await userEvent.click(logoutBtn);
    });

    expect(api.post).toHaveBeenCalledWith("/users/logout");

    await waitFor(() => {
      expect(screen.getByTestId("user-status")).toHaveTextContent("Logged Out");
      expect(localStorage.getItem("accessToken")).toBeNull();
    });
  });
});
