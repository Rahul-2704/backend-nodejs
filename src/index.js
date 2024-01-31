// require('dotenv').config(
//     {path:'./env'}
// )
// Above wont work
import express from "express";
import dotenv from "dotenv";
dotenv.config({path:'./env'});
import { app } from "./app.js";
import connectDB from "./db/index.js";

connectDB().then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server running at port:${process.env.PORT}`)
    })
}).catch((err)=>{
    console.log("MONGO db connection error failed!!",err);
});














// ;(async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error",(error)=>{
//             console.log("ERR:",error);
//             throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`Process in running on port ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.log("ERROR:",error)
//     }
// })()