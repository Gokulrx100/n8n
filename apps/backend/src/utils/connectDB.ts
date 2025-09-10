import mongoose from "mongoose";

const connectDB = async () => {
    try{
    const mongoURI = process.env.MONGO_URI!;
    await mongoose.connect(mongoURI);
    console.log("mongoDB connected");
    }catch(err){
        console.error("MongoDB connection error : ", err);
    }
}

export default connectDB;