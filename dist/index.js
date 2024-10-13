var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import mongoose from "mongoose";
import ejsMate from "ejs-mate";
import path from "path";
import flash from "connect-flash";
import ExpressError from "./utils/ExpressError";
import methodOverride from "method-override";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "./models/user";
import helmet from "helmet";
import MongoStore from "connect-mongo";
import mongoSanitize from "express-mongo-sanitize";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const __dirname = path.resolve();
const dbUrl = "mongodb://127.0.0.1:27017/prosperaviva";
mongoose.connect(dbUrl);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});
const app = express();
app.use(cors());
app.use(express.json());
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize({
    replaceWith: "_",
}));
const secret = "thisshouldbeabettersecret!";
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret,
    },
});
store.on("error", function (e) {
    console.log("Session Store Error", e);
});
const sessionConfig = {
    store,
    name: "session",
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: true,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};
app.use(flash());
app.use(helmet());
// app.use(
//     helmet.contentSecurityPolicy({
//         directives: {
//             defaultSrc: ["'self'"],
//             scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
//             styleSrc: ["'self'", "https://cdn.jsdelivr.net"],
//             fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
//             imgSrc: ["'self'", "data:"],
//         },
//     })
// )
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser((user, done) => {
    done(null, user._id);
});
passport.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User.findById(id);
        done(null, user);
    }
    catch (err) {
        done(err);
    }
}));
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});
// app.use("/", userRoutes);
// app.get("/", (req, res) => {
//     res.render("home");
// });
app.use(express.static(path.join(__dirname, "views", "public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "public", "index.html"));
});
app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message)
        err.message = "Something went wrong!";
    res.status(statusCode).render("error", { err });
});
app.post("/api/advice", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userInput } = req.body;
    try {
        const response = yield axios.post("https://api.openai.com/v1/engines/davinci-codex/completions", {
            prompt: `Provide financial advice based on the following input: ${userInput}`,
            max_tokens: 150,
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        res.json({ advice: response.data.choices[0].text });
    }
    catch (error) {
        res.status(500).send("Error generating advice");
    }
}));
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serving on port ${PORT}`);
});
