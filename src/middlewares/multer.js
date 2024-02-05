// to handle the file uploaded from user to store on cloudinary

import multer from "multer";

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        // it will return the localpath
        cb(null,'./public/temp')
    },
    filename:function(req,file,cb){
        // it will return filename 
        cb(null,file.originalname);
    }
})


export const upload=multer({
    storage
});
