# Backend Heavy (Video Hosting Platform API)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

This is a comprehensive and robust backend API built for a video hosting platform (similar to YouTube). It provides essential features to run a media-rich application, including secure user authentication, complex video uploading systems, user engagement mechanics, and playlist management.

## 🚀 Key Features

- **User Authentication:** Robust, secure signup and login using JSON Web Tokens (JWT) and bcrypt password hashing.
- **Video Management:** Scalable video uploading, management, and publishing. Integrates securely with Cloudinary for fast media delivery.
- **Performance:** Endpoints leverage **Redis** caching for optimized response times.
- **Engagement Mechanics:** Users can like or dislike videos and comments.
- **Comments System:** Extensive hierarchical commenting capabilities on published videos.
- **Subscriptions:** Powerful subscription system to follow favorite channels/users and track subscriber counts.
- **Playlists:** End-users can curate, manage, and share customized video playlists.
- **File Uploads:** Secure `multipart/form-data` handling using Multer, supporting image (avatars/covers) and video (content) uploads.

## 🛠️ Tech Stack

- **Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB & Mongoose (ODM)
- **Caching:** Redis
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** bcrypt (Password Hashing)
- **Media Storage:** Cloudinary
- **File Parsing:** Multer

## 📡 Core API Endpoints

The API is prefixed with `/api/v1/`. Below is a selection of the major endpoints available:

### Users `/api/v1/users`

- `POST /register` - Register a new user (with avatar and cover image upload).
- `POST /login` - Log in user and generate JWT tokens.
- `POST /logout` - Log out current user (Secured).
- `POST /refreshtoken` - Refresh access token.
- `GET /current-user` - Get details of the currently logged-in user.
- `GET /c/:username` - Get channel profile by username.
- `GET /history` - Get user watch history.
- `PATCH /update-account` - Update text details.
- `PATCH /avatar` & `/cover-Image` - Update profile media.

### Videos `/api/v1/videos`

- `GET /` - Retrieve paginated videos (Optimized with Redis cache ⚡).
- `POST /` - Upload and publish a new video with thumbnail.
- `GET /:videoId` - Get a specific video.
- `PATCH /:videoId` - Update video details.
- `DELETE /:videoId` - Delete a video.
- `PATCH /toggle/publish/:videoId` - Toggle publish status.

_(Other routers available: `/comments`, `/likes`, `/playlists`, `/subscriptions`)_

## ⚙️ Setup & Installation

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
Create a `.env` file in the root directory and add the following context (configure with your own values):

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

**4. Run the Development Server**

```bash
npm run dev
```

The server will start running with `nodemon` and experimental JSON modules enabled!

## 📁 Project Structure Highlights

- **`src/models/`**: Defines the Mongoose schemas (User, Video, Comment, Like, Subscription, Playlist).
- **`src/routes/`**: Holds API endpoint routers corresponding to each major feature block.
- **`src/controllers/`**: Contains the business logic for the routes.
- **`src/middlewares/`**: Custom Express middlewares for authentication, file validation, Multer uploads, and Redis caching.
- **`src/utils/`**: Helper functions like API error handling and typical response formatting.

---

_Created by Arjun Tandon_
