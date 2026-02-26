import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Regular Upload 
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //file has been uploaded successful
    // console.log("file uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation succeeds
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation failed
    return null;
  }
};

//HLS UPLOAD - Only for videos 

const uploadVideoWithHLS = async ( localFilePath ) => {
  try {
    if(!localFilePath) return null;

    console.log( "Uploading to Cloudinary and generating HLS chunks")

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "video",
      //Eager Transformations
      eager: [
        { streaming_profile: "hd", format: "m3u8" } //Cloudinary automatically handles this and generate chunks of (720/480/360)p 
      ],
      eager_async: true //IMP step: video processing takes time
    });

    // Delete from local server 
    fs.unlinkSync(localFilePath);

    //URL CRAFTING 
    // Cloudinary by default generates and returns mp4 URL 
    // we have to generate .m3u9 (Playlist file) URL and save it in DB
    // Standard URL ---> HLS URL (modify): 
    
    const hlsUrl = response.secure_url
                  .replace(".mp4", ".m3u8")
                  .replace("/video/upload/", "/video/upload/sp_hd/"); // 'sp_hd' Cloudinary ka streaming profile flag

    // sending 'hls_url' with original response 
    return {
      ...response, hls_url: hlsUrl
    }
  }catch (error){
    fs.unlinkSync(localFilePath);
    console.error("HLS Video Upload Error", error);
    return null;
  }
}

export { uploadOnCloudinary , uploadVideoWithHLS};
