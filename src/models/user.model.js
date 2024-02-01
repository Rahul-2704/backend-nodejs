import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema=new Schema({
   username:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    // to make it easier for searching
    index:true
   },
   email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
   },
   fullname:{
    type:String,
    required:true,
    trim:true,
    // to make it easier for searching
    index:true
   },
   avatar:{
    type:String,
    required:true
   },
   converImage:{
    type:String
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,'Password is required.']
    },
    refreshToken:{
        type:String,

    }
},{
    timestamps:true
})
// to validate password before saving data
userSchema.pre("save",async function(next){
    // hash the password only if it's modified
    if(!this.isModified("password")){
        return next();
    }
    this.password=bcrypt.hash(this.password,10);
    next()
})

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken=function(password){
    // jwt.sing({payload},token_secret,expiry)
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
    })
}

userSchema.methods.generateRefreshToken=function(password){
     // jwt.sing({payload},token_secret,expiry)
    return jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY,
    })
}
export const User=mongoose.model("User",userSchema);