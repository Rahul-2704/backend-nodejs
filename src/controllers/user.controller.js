import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadonCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";
const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

        // saving refreshtoken to database
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken};


    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access tokens.")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
    // get user details from frontend
    // validation-not empty
    // check if user already exists -username,email
    // check for images,check for avatar
    // upload them to cloduinary,avatar
    // create user object-create entry in db
    // remove password and refresh token feed from response
    // check for user creation
    // return res

    const {
        fullname,username,email,password
    }=req.body;
    
    if([fullname,email,username,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser=await User.findOne({
        $or:[{email},{username}]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists.")
    }

    const avatarlocalPath=req.files?.avatar[0]?.path;
    // const coverImagelocalPath=req.files?.coverImage[0]?.path;
    let coverImagelocalPath;
    if(req.files&&Array.isArray(req.files.converImage)&&req.files.converImage.length>0){
        coverImagelocalPath=req.files.converImage[0].path;
    }
    if(!avatarlocalPath){
        throw new ApiError(400,"Avatar file is required.")
    }
    const avatar=await uploadonCloudinary(avatarlocalPath);
    const coverImage=await uploadonCloudinary(coverImagelocalPath);

    if(!avatar) throw new ApiError(400,"Avatar file is required.");

    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase(),
    });

    const createdUser=await User.findById(user._id).select(
        "-passowrd -refreshToken"
    );

    if(!createdUser) throw new ApiError(500,"Something went wrong while registring the user")

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully.")
    )
})

const loginUser=asyncHandler(async(req,res)=>{
    // username/email and password is required
    const {username,email,password}=req.body;
    console.log(email);
    // check username or email
    if(!username && !email){
        throw new Error(400,"username or password is required")
    }
    // find the user from db
    const user=await User.findOne({
        // finding user on the basis of either username or email
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User not found.")
    }
    // validate password

    const isValid=await user.isPasswordCorrect(password);
    if(!isValid){
        throw new ApiError(401,"Invalid Password credentials.")
    }

    // access and refresh token

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);

    // send cookie
    const loggedInUserData = await User.findById(user._id).select("-password -refreshToken");
    const loggedInUser = loggedInUserData.toObject(); // Convert to a plain JavaScript object
    const options={
        // modified from server only
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse
        (
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully."
        )
    )
});

const logOutUser=async(req,res)=>{
    //  we can't get the access of user hence we will create on middleware to handle this
    User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined
        }
    },
    {
        new:true
    }
    );

    const options={
        httpOnly:true,
        secure:true
    }
    // first clear cookies and remove the refreshToken
    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out."))
   
}

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request");
    }
    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401,"Invalid refresh Token");
        }
    
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used.")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const{accessToken,newrefreshToken}=await generateAccessAndRefreshTokens(user._id);
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,refreshToken:newrefreshToken
                },
                "Access token refreshed successfully."
            )
        )
    } catch (error) {
        throw new ApiError(401,"Invalid refresh Token")
    }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword,confirmPassword}=req.body;

    const user=await User.findById(req.user?._id);
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }
    if(newPassword==confirmPassword){
        user.password=newPassword
        await user.save({validateBeforeSave:false})
    }
    else throw new ApiError(400,"Passwords are not matching.");

    return res.status(200).json(new ApiResponse(
        200,{},"Password changed successfully."
    ))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(
        200,req.user,"Current user fetched successfully."
    ));
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body;
    if(!fullname||!email){
        throw new ApiError(400,"All fields are required");
    }
    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {new:true}

        ).select("-password");

    return res.status(200)
    .json(new ApiResponse(
        200,user,"Account details updated successfully."
    ))
});

// for handling files we also have to add the middlwaers in the routes 
// multer for file handling and to check the user has to be logged in.
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarImage=req.file?.path;

    if(!avatarImage){
        throw new ApiError(400,"Avatar file is missing.")
    }
    const avatar=await uploadonCloudinary(avatarImage);
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar.")
    }

    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
        ).select("-password");
    return res.status(200)
    .json(new ApiResponse(200,user,"Avatar Image updated successfully."))  
});

const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverImagePath=req.file?.path;
    if(!coverImagePath){
        throw new ApiError(400,"Cover Image not uploaded")
    }

    const coverImage=await uploadonCloudinary(coverImagePath);

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading coverImage(update)")
    }

    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage:coverImage.url
        }
    },
    {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(
        200,user,"CoverImage updated successfully."
    ));
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const{username}=req.params;
    if(!username?.trim()) throw new ApiError(4400,"username is missing")

    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            // channel ke kitne subscribers hai
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            // kitne channel ko subscribe kiya hai
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            // user doc mai 2 fields add ki
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribeToCountt:{
                    $size:"$subscribedTo"
                },
                isSubscribedTo:{
                    $cond:{
                        // user mere subscriber ke list mai present hai
                        if:{$in:[req.user?._id,"subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribeToCountt:1,
                isSubscribedTo:1,
                avatar:1,
                coverImage:1,
                email:1,
                createdAt:1
            }
        }
    ]);

    if(!channel?.length) throw new ApiError(404,"Channel does not exist.")

    console.log("channel",channel);
    return res.status(200)
    .json(new ApiResponse(200,channel[0],"User's Channel Information fetched successfully."))
})

const getWatchHistory=asyncHandler(async(req,res)=>{
   const user=await User.aggregate([
    {
        $match:{
            _id:new mongoose.Types.ObjectId(req.user?._id)
        }
    },
    {
        $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner"
                    },
                    pipeline:[
                        {
                            $project:{
                                fullname:1,
                                username:1,
                                avatar:1
                            }
                        }
                    ]
                },
                {
                    $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                }
            ]
        }
    }
   ])

   return res.status(200)
   .json(new ApiResponse(
    200,user[0].watchHistory,
    "Watch History fetched successfully."
   ))

})
export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateCoverImage,
    updateUserAvatar,
    getUserChannelProfile,
    getWatchHistory
}