import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()

// Allow multiple origins: comma-separated CORS_ORIGIN env var + localhost for dev
const allowedOrigins = [
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(s => s.trim()) : []),
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true
}))




app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true,limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser()) 


//routes import 
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from './routes/comment.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import likeRouter from './routes/like.routes.js'


// Health check route
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "VidSeam API is running 🚀" });
});

// routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/likes", likeRouter)
//Mechanism:User requests `//localhost:8000/api/v1/users` then `app.use()` transfers the request to `userRouter`. Inside `userRouter`,it routes to `/register` and calls the controller `registerUser` from `user.controller.js` . 

// Global error handler — ensures ApiError instances return JSON, not HTML
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || "Something went wrong",
    errors: err.errors || [],
  });
});

export { app }
