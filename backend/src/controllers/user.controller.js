import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadCloudinary from "../utils/cloudinary.js";

const getUser = asyncHandler(async(req, res) => {
    const{username,email} = req.body;
    const user = await User.findOne({$and :[{username:username},{email:email}]}).select("-email");
    return res.status(200).json(new ApiResponse(200,user,"User fetched successfully"));    
})
const status= asyncHandler(async(req, res) => {
    const{status} = req.body;
    const user = await User.findOne({status:{$eq:false}}).select("-email");
    return res.status(200).json(new ApiResponse(200,user,"User fetched successfully"));    
})
const createUser = asyncHandler(async (req, res) => {
    const { username, email, description, phoneNumber, Incident, location, severity, status } = req.body;
    if (!(username && description && phoneNumber && Incident && location && severity)) {
        throw new ApiError(404, "All fields are required");
    }
    
    let imageUrl = "";
    if (req.file && req.file.buffer) {
        const imageToUpload = await uploadCloudinary(req.file.buffer);
        console.log(imageToUpload);
        if(!imageToUpload){
            throw new ApiError(500,"Image upload failed");
        }
        imageUrl = imageToUpload.secure_url;
    } else {
        // Use a default image if no file is provided
        imageUrl = "https://via.placeholder.com/400";
    }
    
    const phoneNum = parseInt(phoneNumber);
    if (isNaN(phoneNum) || phoneNum.toString().length !== 10) {
        throw new ApiError(400, "Phone number must be a valid 10-digit number");
    }

    const user = await User.create({
        username,
        email: email || `${username.replace(/\s+/g, '_')}@resq.local`,
        description,
        phoneNumber: phoneNum,
        Incident,
        location: typeof location === 'object' ? `${location.lat},${location.lng}` : location,
        severity,
        status: status !== undefined ? status : false,
        image: imageUrl
    })
    await user.save();
    const createUser = await User.findById(user._id).select("-email");
    if(!createUser){
        throw new ApiError(400,"Something went wrong while adding in the database")
    }
    return res.status(200).json( new ApiResponse(200,createUser,"User was added to into the database"));
})
const deleteUser = asyncHandler(async (req, res) => {
   const deleteUser = await User.findByIdAndDelete(req._id);
   if(!deleteUser){
    throw new ApiError(404,"The user do not exist");
   }
})

const updateStatus = asyncHandler(async (req, res) => {
    const {username, email, status, _id } = req.body;
    
    let updateFields;
    if (_id) {
        // Update by ID (preferred method)
        updateFields = await User.findByIdAndUpdate(_id, {
            status: status !== undefined ? status : true
        }, {
            new: true
        }).select("-email");
    } else if (username && email) {
        // Update by username and email (fallback)
        updateFields = await User.findOneAndUpdate({$and :[{username:username},{email:email}]},{
            status: status !== undefined ? status : true
        },{
            new:true
        }).select("-email");
    } else {
        throw new ApiError(400, "Either _id or username and email are required");
    }
    
    if(!updateFields){
        throw new ApiError(404,"Failed to update the status")
    }
    return res.status(200).json(new ApiResponse(200,updateFields,"Fields were updated"));    
})

const updateUser = asyncHandler(async (req, res) => {
    const {username, email, description, phoneNumber, Incident, location, severity, status } = req.body;
    const updateFields = await User.findOneAndUpdate({$and :[{username:username},{email:email}]},{
        username, description, phoneNumber, Incident, location, severity, status
    },{
        new:true
    }).select("-email");
    if(!updateFields){
        throw new ApiError(404,"Failed to update the fields")
    }
    return res.status(200).json(new ApiResponse(200,updateFields,"Fields were updated"));    
})

const getAllReports = asyncHandler(async (req, res) => {
    const reports = await User.find().select("-email").sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, reports, "All reports fetched successfully"));
})

const getReportsByPhone = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.params;
    if (!phoneNumber || phoneNumber === "N/A") {
        return res.status(200).json(new ApiResponse(200, [], "No phone number provided"));
    }
    const phoneNum = parseInt(phoneNumber);
    if (isNaN(phoneNum)) {
        throw new ApiError(400, "Invalid phone number format");
    }
    const reports = await User.find({ phoneNumber: phoneNum }).select("-email").sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, reports, "User reports fetched successfully"));
})

export default { getUser, createUser, deleteUser, updateUser ,updateStatus, status, getAllReports, getReportsByPhone}