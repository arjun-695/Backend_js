import redisClient from "../utils/redis.js";
import { ApiError } from "../utils/apiError.js";

export const cacheRoute = (expireSeconds = 300) => {
    return async( req, res , next) => {

        if(req.method !== "GET"){
            return next();
        }

        const key = `cache:${req.originalUrl}`;

        try{
            const cachedData = await redisClient.get(key);

            if(cachedData) {
                console.log(`serving from redis Cache: ${key}`)
                return res.status(200).json(JSON.parse(cachedData))
            }

            console.log(`Cache Miss, serving from DB: ${key}`);

            const originalSend = res.json;

            res.json = function(data) {
                if(res.statusCode >= 200 && res.statusCode < 300)
                {
                    redisClient.setEx(key, expireSeconds, JSON.stringify(data));
                }
                
                return originalSend.call(this, data);
            };

            next();
        } catch(error) {
            console.error(`⚠️ Redis Middleware Error for [${key}]:`, error.message);
            next(); 
        }
    }
}