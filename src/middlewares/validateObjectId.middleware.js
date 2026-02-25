import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";

export const checkValidObjectId = (paramNamesArray) => {

    return (req,res, next) => {
        for( const paraName of paramNamesArray){
            const id = req.params[paraName];

            if( id && !mongoose .isValidObjectId(id)){
                return next(new ApiError(400, `Invalid ${paraName} format `));
            }
        }
        next(); //ID's are okay
    }
}