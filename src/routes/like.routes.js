import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {checkValidObjectId} from '../middlewares/validateObjectId.middleware.js';
import {getLikedVideos, toggleCommentLike, toggleVideoLike } from "../controllers/like.controller.js"

const router = Router();
router.use(verifyJWT); 

router.route("/toggle/c/:commentId").post(checkValidObjectId(['commentId']), toggleCommentLike)

router.route("/toggle/v/:videoId").post(checkValidObjectId(['videoId']), toggleVideoLike)

router.route("/videos").get(getLikedVideos)

    export default router;
