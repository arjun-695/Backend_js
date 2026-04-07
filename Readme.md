# Backend Heavy (Video Hosting Platform API)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

This is a comprehensive backend API for a video hosting platform similar to YouTube. It covers secure authentication, video publishing, media delivery, playlists, subscriptions, likes, comments, and creator-facing tools for richer video metadata.

## Key Features

- **User Authentication:** Secure signup and login using JSON Web Tokens (JWT) and bcrypt password hashing.
- **Video Management:** Video upload, publishing, editing, and deletion with Cloudinary-backed media storage.
- **Video Summaries:** Each video can store an auto-generated summary using its title, description, and optional transcript text.
- **Comment Sentiment Analysis:** Each comment is automatically scored as positive, neutral, or negative, and comment feeds expose a discussion-level sentiment overview.
- **Performance:** Endpoints leverage Redis caching for improved response times.
- **Engagement Mechanics:** Users can like videos and comments, subscribe to channels, and manage playlists.
- **File Uploads:** Secure `multipart/form-data` handling using Multer for images and videos.

## Tech Stack

- **Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB and Mongoose
- **Caching:** Redis
- **Authentication:** JWT
- **Security:** bcrypt
- **Media Storage:** Cloudinary
- **File Parsing:** Multer

## Core API Endpoints

The API is prefixed with `/api/v1/`.

### Users `/api/v1/users`

- `POST /register` - Register a new user with avatar and cover image uploads.
- `POST /login` - Log in a user and generate JWT tokens.
- `POST /logout` - Log out the current user.
- `POST /refreshtoken` - Refresh the access token.
- `GET /current-user` - Fetch the currently logged-in user.
- `GET /c/:username` - Fetch a channel profile by username.
- `GET /history` - Fetch watch history.
- `PATCH /update-account` - Update account text fields.
- `PATCH /avatar` and `PATCH /cover-Image` - Update profile media.

### Videos `/api/v1/videos`

- `GET /` - Retrieve paginated videos.
- `POST /` - Upload and publish a new video with thumbnail and optional `transcript` text.
- `GET /:videoId` - Fetch a specific video with its generated summary.
- `PATCH /:videoId` - Update video details and refresh the stored summary when relevant fields change.
- `DELETE /:videoId` - Delete a video.
- `PATCH /toggle/publish/:videoId` - Toggle publish status.

### Comments `/api/v1/comments`

- `GET /:videoId` - Fetch paginated comments plus a sentiment overview for the full discussion.
- `POST /:videoId` - Add a comment with automatic sentiment scoring.
- `PATCH /c/:commentId` - Update a comment and recompute sentiment.
- `DELETE /c/:commentId` - Remove a comment.

Other routers are available for likes, playlists, and subscriptions.

## Setup and Installation

**1. Clone the repository**

```bash
git clone <repository_url>
cd backend_Heavy
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

Create a `.env` file in the root directory and add the following values:

```env
PORT=8000
MONGODB_URI=<your_mongodb_connection_string>
CORS_ORIGIN=*

ACCESS_TOKEN_SECRET=<your_access_token_secret>
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=<your_refresh_token_secret>
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
```

Optional note: when uploading a video, you can include a `transcript` field in the multipart form body to improve summary quality.

**4. Run the development server**

```bash
npm run dev
```

The backend uses `nodemon`, loads environment variables from `.env`, and starts after the database connection succeeds.

## Project Structure Highlights

- **`src/models/`**: Mongoose schemas for users, videos, comments, likes, subscriptions, and playlists.
- **`src/routes/`**: Express routers for each feature area.
- **`src/controllers/`**: Route-level business logic.
- **`src/middlewares/`**: Authentication, validation, uploads, and caching middleware.
- **`src/utils/`**: Shared helpers for API responses, error handling, cloud storage, caching, summaries, and sentiment analysis.

---

_Created by Arjun Tandon_
