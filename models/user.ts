import mongoose, { Document, PassportLocalDocument, PassportLocalModel, Schema } from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

export interface IUser extends PassportLocalDocument {
    username: string;
    email: string;
}

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true },
    email: { type: String, required: true },
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model<IUser>("User", UserSchema) as PassportLocalModel<IUser>;

export default User;