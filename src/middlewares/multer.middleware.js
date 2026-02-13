import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp") //filepath 
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname)//room for improval
  }
})

export const upload = multer({storage, })