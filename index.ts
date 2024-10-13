/*

THINGS TO NOTE TO THOSE LOOKING AT THE SOURCE CODE:

TO RUN THIS APP ON YOUR LOCAL MACHINE, YOU WILL NEED TO CREATE A .env FILE IN THE ROOT DIRECTORY OF THE PROJECT. Please see the README.md for more information.

EJS is incorporated to handle newer features of the app, such as including different requests to the server and render them on the client side.
EJS is also created to handle error handling with any requests that are made to the server, such as 404 and 500 errors.

MongoDB is outlined with Mongoose user schemes to incorporate user authentication and user data storage.
NOTE: This is an unfinished feature and will be updated in the future.

Passport is incorporated to handle user authentication and user data storage.

Helmet, MongoStore, MongoSanitize, and Express-Session are incorporated to handle security features of the app. This includes handling session data, sanitizing user input, and preventing cross-site scripting attacks. Ultimately, this makes up the security features of the app.

Many features here were built previously but could not be finished due to time constraints and the project being solo. These features will be updated in the future.

*/

import express, { Request, Response, NextFunction } from "express";
import mongoose, { Document } from "mongoose";
import ejsMate from "ejs-mate";
import session from "express-session";
import path from "path";
import flash from "connect-flash";
import methodOverride from "method-override";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User, { IUser } from "./models/user";
import helmet from "helmet";
import MongoStore from "connect-mongo";
import mongoSanitize from "express-mongo-sanitize";
import { EventEmitter } from "events";
import ExpressError from "./utils/ExpressError";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
    project: process.env.OPENAI_PROJECT_ID,
});

// inline mongoose schema

const adviceSchema = new mongoose.Schema({
    userInput: { type: String, required: true },
    advice: { type: String, required: true },
});

const Advice = mongoose.model("Advice", adviceSchema);

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
app.use(
    mongoSanitize({
        replaceWith: "_",
    })
);

const secret = "thisshouldbeabettersecret!";

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret,
    },
}) as unknown as EventEmitter;

store.on("error", function (e: Error) {
    console.log("Session Store Error", e);
});

const sessionConfig: any = {
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

app.use(session({
    secret: process.env.SESSION_SECRET || "thisisasecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

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

passport.serializeUser((user: any, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});



app.use((req: Request, res: Response, next: NextFunction) => {
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

app.post("/api/advice", async (req: Request, res: Response) => {
    const { userInput } = req.body;
    if (!userInput || userInput.trim() === "") {
        return res.status(400).json({ error: "Invalid input" });
    }
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: `Provide financial advice based on the following input: ${userInput}` }],
                max_tokens: 150,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        res.json({ advice: response.data.choices[0].message.content });
    } catch (error) {
        const err = error as any;
        console.error("Error generating advice", err.response ? err.response.data : err.message);
        res.status(500).send("Error generating advice");
    }
});

app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "views", "public", "index.html"));
});


app.all("*", (req: Request, res: Response, next: NextFunction) => {
    next(new ExpressError("Page Not Found", 404));
});

app.use(
    (err: ExpressError, req: Request, res: Response, next: NextFunction) => {
        const { statusCode = 500 } = err;
        if (!err.message) err.message = "Something went wrong!";
        res.status(statusCode).render("error", { err });
    }
);


const PORT = process.env.BACKEND_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serving on port ${PORT}`);
});
