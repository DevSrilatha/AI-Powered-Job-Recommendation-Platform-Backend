const mongoose= require('mongoose');
// import mongoose from 'mongoose'; 
const mongoURI="mongodb://127.0.0.1:27017/job_recommendation_db";

const connectToMongo=async()=>{
    try{
     await mongoose.connect(mongoURI,{

    })
    console.log("Connected to mongo successfully");
} catch(error){
 console.log("connection failed",error.message)
}
};
module.exports=connectToMongo;