import { Router } from 'express';
import {
    createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js"

import { verifyJWT} from "../middlewares/auth.middleware.js"
import {checkValidObjectId} from '../middlewares/validateObjectId.middleware.js';

const router = Router();

router.use(verifyJWT) // apply verifyJWT to all the routes in this file

router.route("/").post(createPlaylist)
router.route("/user/:userId").get(checkValidObjectId(["userId"]),getUserPlaylists)

router
        .route("/:playlistId")
        .get(checkValidObjectId(["playlistId"]), getPlaylistById)
        .patch(checkValidObjectId(["playlistId"]), updatePlaylist)
        .delete(checkValidObjectId(["playlistId"]), deletePlaylist)
        
router.route("/add/:videoId/:playlistId").patch(checkValidObjectId(["videoId", "playlistId"]), addVideoToPlaylist)

router.route("/remove/:videoId/:playlistId").patch(checkValidObjectId(["videoId", "playlistId"]), removeVideoFromPlaylist);

export default router