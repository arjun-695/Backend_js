import multer from "multer";
import os from "os";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir()) // use system temp directory for serverless compat
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname)//room for improvement
  }
})

export const upload = multer({ storage })