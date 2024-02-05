import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

// how much json data you want to process else server will get crashed
app.use(express.json({
    limit:"16kb"
}));
// extended -->nested objects
app.use(express.urlencoded({extended:true,limit:"16kb"}));
// to store images or files 
app.use(express.static("public"));
app.use(cookieParser());


// routes

import userRouter from './routes/user.routes.js';

// routes declaration

app.use("/api/v1/users",userRouter);

export {app}
