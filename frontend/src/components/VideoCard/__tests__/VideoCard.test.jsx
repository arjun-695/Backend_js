import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import VideoCard from "../VideoCard";

// Wrap component with router since it uses <Link> tags
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("VideoCard Component", () => {
  const mockVideo = {
    _id: "vid_12345",
    title: "Testing React Components",
    thumbnail: "https://example.com/thumb.jpg",
    views: 1042,
    createdAt: new Date().toISOString(), // recent
    duration: 125, // 2 minutes, 5 seconds
    owner: {
      _id: "user_1",
      username: "johndoe",
      fullName: "John Doe",
      avatar: "https://example.com/avatar.jpg",
    },
  };

  test("renders video title correctly", () => {
    renderWithRouter(<VideoCard video={mockVideo} />);
    const titleElement = screen.getByText("Testing React Components");
    expect(titleElement).toBeInTheDocument();
  });

  test("formats and displays duration correctly", () => {
    renderWithRouter(<VideoCard video={mockVideo} />);
    // 125 seconds = 2:05
    const durationElement = screen.getByText("2:05");
    expect(durationElement).toBeInTheDocument();
  });

  test("renders channel information", () => {
    renderWithRouter(<VideoCard video={mockVideo} />);
    const channelName = screen.getByText("John Doe");
    expect(channelName).toBeInTheDocument();

    // Check if the avatar image has correct src and alt
    const avatar = screen.getByAltText("johndoe");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  test("displays view count", () => {
    renderWithRouter(<VideoCard video={mockVideo} />);
    const viewsElement = screen.getByText(/1042 views/i);
    expect(viewsElement).toBeInTheDocument();
  });

  test("handles missing video data gracefully", () => {
    const { container } = renderWithRouter(<VideoCard video={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
