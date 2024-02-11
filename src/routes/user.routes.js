import { Router } from "express";
import { changeCurrentPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    logOutUser, 
    loginUser, 
    refreshAccessToken, 
    registerUser, 
    updateUserAvatar ,
    updateCoverImage,
    updateAccountDetails
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        }
        ,
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// secured routes
// logout ke pehle custom middlware user karlo
router.route("/logout").post(verifyJWT,logOutUser);
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword);
router.route("/current-user").get(verifyJWT,getCurrentUser);
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails);
router.route("/update-profile").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);
router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateCoverImage);
router.route("/channel/:username").get(verifyJWT,getUserChannelProfile);
router.route("/watch-history").get(verifyJWT,getWatchHistory);

export default router