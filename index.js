const express=require('express')

const app=express();


app.get('/',(req,res)=>{
    res.send("Hello Get Request")
})

app.listen(8000,()=>{
    console.log("Server running on 8000")
})