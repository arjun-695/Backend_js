import mongoose, {Schema} from "mongoose"

const subscriptionSchema =new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,//person who is subscribing 
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,//one who gets subscribed 
        ref: "User"
    },
    
},{timestamps: true})

export const Subsciption = mongoose.model("Subscription",
    subscriptionSchema
)
