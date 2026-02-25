import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoId,
    publishVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"
import {checkValidObjectId} from '../middlewares/validateObjectId.middleware.js';

const router = Router();
router.use(verifyJWT)

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishVideo
    );


    router
    .route("/:videoId")
    .get(checkValidObjectId(["videoId"]),getVideoId)
    .delete(checkValidObjectId(["videoId"]),deleteVideo)
    .patch(checkValidObjectId(["videoId"]),upload.single("thumbnail"), updateVideo);
    
    
    router.route("/toggle/publish/:videoId").patch(checkValidObjectId(["videoId"]),togglePublishStatus);
    
    export default router