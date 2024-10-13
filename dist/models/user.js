import mongoose, { Schema } from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
const UserSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
});
UserSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", UserSchema);
export default User;
