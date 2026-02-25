import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkValidObjectId } from "../middlewares/validateObjectId.middleware.js";
import { cacheRoute } from "../middlewares/redis.middleware.js";

const router = Router();
router.use(verifyJWT);

router
  .route("/:videoId")
  .get(checkValidObjectId(["videoId"]),cacheRoute(300), getVideoComments)
  .post(checkValidObjectId(["videoId"]), addComment);

router
  .route("/c/:commentId")
  .delete(checkValidObjectId(["commentId"]), deleteComment)
  .patch(checkValidObjectId(["commentId"]), updateComment);

export default router;
