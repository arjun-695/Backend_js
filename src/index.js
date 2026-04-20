// require{'dotenv'}.config({path:'/.env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { connectRedis } from "./utils/redis.js";

// important points for connecting data base:
// always use try and catch or promises with database
// always use async await for database because it is stored far away
// because database operations are Time consuming and uncertain

// Only load .env file in local development (Vercel injects env vars directly)
if (!process.env.VERCEL) {
  dotenv.config({
    path: "./.env",
  });
}

// Cache the connection promise so it only runs once per cold start (Vercel)
let isConnected = false;

async function bootstrap() {
  if (isConnected) return;
  try {
    await connectDB();
    await connectRedis();
    isConnected = true;
  } catch (err) {
    console.error("Bootstrap connection failed:", err);
    // Don't call process.exit() — let Vercel return a proper error
  }
}

// On Vercel: connect eagerly so the first request is fast
bootstrap();

// Only start the HTTP listener in local development
if (!process.env.VERCEL) {
  bootstrap().then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT || 8000}`);
    });

    app.on("error", (error) => {
      console.log("Express App Error: ", error);
      throw error;
    });
  });
}

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

export default app;
