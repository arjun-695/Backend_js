// require{'dotenv'}.config({path:'/.env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js"

import express from "express"
const app = express()
// important points for connecting data base:
// always use try and catch or promises with database
// always use async await for database because it is stored far away
// because database operations are Time consuming and uncertain
dotenv.config({
    path:'./env'
})
connectDB()


// 2 approaches: everything in 1 file; calling function to database that is on another file


/*  commenting because this approach messes the code as it includes everything in 1 single file 
;( async () => {
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // app error listener: 
       app.on("error",(error)=>{
        console.log("Error",error);
        throw error
       })

       app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${process.env.PORT}`)
       })


    }catch(error){
        console.error("Error:", error)
        throw error
    }
})()
*/