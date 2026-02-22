import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp") //filepath; store file temp on local memory 
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname)//room for improvement
  }
})

export const upload = multer({ storage })