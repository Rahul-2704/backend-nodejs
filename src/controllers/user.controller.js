import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadonCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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


export {registerUser}