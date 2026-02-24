import { Router } from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {checkValidObjectId} from '../middlewares/validateObjectId.middleware.js';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription
} from "../controllers/subscription.controller.js"

const router = Router()

router . use(verifyJWT)

router
    .route("/c/:channelId")
    .post(checkValidObjectId(['channelId']), toggleSubscription )
    .get(checkValidObjectId(['channelId']), getUserChannelSubscribers )

router.route("/u/:subscriberId").get(checkValidObjectId(['subscriberId']), getSubscribedChannels);

export default router;