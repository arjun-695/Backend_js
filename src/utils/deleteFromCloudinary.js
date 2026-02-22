import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteFromCloudinary = 
  async (filePublic_id, resourceType = "image") => {
    try {
      if (!filePublic_id) return null;

      const response = await cloudinary.uploader.destroy(filePublic_id, {
        resource_type: resourceType,
      });
      return response;
    } catch (error) {
      console.error("Error deleting file from Cloudinary", error);
      return null;
    }
  }


export default deleteFromCloudinary;