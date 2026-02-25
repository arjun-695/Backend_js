import {createClient } from 'redis';

let isRedisConnected = false; 

const redisClient = createClient({
    url: process.env.Redis_URI || 'redis://localhost:6379',
    socket: {
        //if redis is down try only 5 times otherwise infinite loop 
        reconnect: (retries) => {
            if(retries> 5){
                // console.log('Redis reconnet attempts exceeded')
                return false;//stop retrying 
            }
            return Math.min(retries * 50, 500); //Backoff strategy
        }
    }
})

//Event Listener
redisClient.on('error', (err) => {
    console.error('Redis Error', err.message )
    isRedisConnected =  false;
})

redisClient.on('connect', ()=> {
    console.log('Redis Client Connected Successfully');
    isRedisConnected = true;
})

redisClient.on('reconnecting', () => {
    console.log('Redis client Reconnecting');
})

redisClient.on('end', () => {
    console.log('Redis client Disconnected');
    isRedisConnected = false;
})

export const connectRedis = async () => {
    try{
        await redisClient.connect();
    }catch(error) {
        //let the app start even if redis fails since redis is not the main storage db
        console.error('Redis Inital connection failed.Operating w/o Cache')
    }
};


export const getFromCache = async(key) => {
    if(!isRedisConnected) return null //Db fallback 

    try {
        
        return await redisClient.get(key);
    } catch (error) {
        console.error('Redis Get Error: ', error.message)
        return null
    }
}

export const setToCache = async(key, value, expInSeconds = 300) => {
    if( !isRedisConnected) return;

    try {
        await redisClient.setEx(key, expInSeconds, value);
    } catch (error) {
        console.error('Redis SET error: ', error.message)
        
    }
}

export const deleteFromCache = async(key) => {
    if(!isRedisConnected)
        return;

    try{
        await redisClient.del(key);
    }catch( error ){
        console.error('Redis DEL error: ' , error.message)
    }
};

export default redisClient; 



