# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
Backend-heavy Node.js application using Express and MongoDB for a video streaming platform ("videotube"). Uses JWT-based authentication with access and refresh tokens.

## Commands

### Development
- **Start dev server**: `npm run dev`
  - Uses nodemon with dotenv config, experimental JSON modules enabled
  - Loads environment from `.env` file
  - Server runs on port 8000 (or PORT from env)

### Code Formatting
- **Format code**: `npx prettier --write .`
  - Configuration in `.prettierrc`: double quotes, 2 spaces, semicolons required

## Architecture

### Application Bootstrap Flow
1. `src/index.js` - Entry point that loads environment variables and initializes app
2. `src/db/index.js` - Establishes MongoDB connection using `MONGODB_URI` from env
3. `src/app.js` - Express app configuration with CORS, JSON parsing, cookie handling, and static file serving
4. Server starts after successful database connection

**Important**: `src/index.js` has duplicate express app declaration (lines 4 and 7) - the one from `app.js` import is correct.

### Data Layer
- **Models** (`src/models/`):
  - `user.model.js` - User schema with bcrypt password hashing, JWT token generation methods
    - Pre-save hook for password hashing
    - Methods: `isPasswordCorrect()`, `generateAccessToken()`, `generateRefreshToken()`
    - References Video model via `watchHistory` array
  - `video.model.js` - Video schema with mongoose-aggregate-paginate-v2 plugin
    - References User model via `owner` field
    - Stores video metadata including Cloudinary URLs for files/thumbnails

### Utilities
- `asyncHandler.js` - Promise-based wrapper for async route handlers (wraps errors for Express)
- `apiError.js` - Custom error class extending Error with `statusCode`, `errors[]`, and `success` fields
- `ApiResponse.js` - Standardized API response format with `statusCode`, `data`, `message`, and `success` fields

### Environment Variables Required
- `PORT` - Server port (default 8000)
- `MONGODB_URI` - MongoDB connection string
- `CORS_ORIGIN` - CORS allowed origins
- `ACCESS_TOKEN_SECRET` / `ACCESS_TOKEN_EXPIRY` - JWT access token config
- `REFRESH_TOKEN_SECRET` / `REFRESH_TOKEN_EXPIRY` - JWT refresh token config

### Database
- MongoDB database name is hardcoded as "videotube" in `src/constants.js`
- Connection automatically appends DB name to the URI

### File Storage
- `public/temp/` - Directory for temporary file uploads (currently empty with .gitkeep)
- User avatars and cover images stored via Cloudinary (URLs in database)
- Video files and thumbnails stored via Cloudinary

## Code Patterns

### Async Operations
Always wrap async route handlers with the `asyncHandler` utility to properly forward errors to Express error middleware.

### Error Handling
- Use `ApiError` class for throwing HTTP errors with appropriate status codes
- Use `ApiResponse` class for consistent success responses
- Database operations always wrapped in try-catch or promises

### Model Methods
User model has custom instance methods for authentication:
- Password comparison uses bcrypt
- Token generation uses JWT with environment-configured secrets and expiry times
