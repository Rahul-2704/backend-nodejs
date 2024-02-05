import mongoose, { mongo } from "mongoose";

const connectDB=async()=>{
    try {
        console.log("connection",process.env.MONGODB_URI);
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log(`\nMONGODB connected!! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection error",error);
        process.exit(1);
    }
}

export default connectDB;