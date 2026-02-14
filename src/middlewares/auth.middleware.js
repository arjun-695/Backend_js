//verifies if the user is there or not
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model";
   

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // request(req) has access to cookies.(as we used cookieParser())
    // cookies have access to Tokens
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); // token from either
  
      // if token is not present 
    if(!token) {
      throw new ApiError(401, "Unauthorized request")
    }
    // else
    //use jwt to check token information
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
  
    //if user is not there
    if(!user){
      throw new ApiError(401, "Invalid Access Token")
    }
    // if user is found
    req.user= user;
    next() 
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
  }

});
