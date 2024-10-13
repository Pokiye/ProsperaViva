import express, { Request, Response, NextFunction } from "express";
import mongoose, { Document } from "mongoose";
import ejsMate from "ejs-mate";
import session from "express-session";
import path from "path";
import flash from "connect-flash";
import ExpressError from "./utils/ExpressError";
import methodOverride from "method-override";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User, { IUser } from "./models/user";
import helmet from "helmet";
import MongoStore from "connect-mongo";
import mongoSanitize from "express-mongo-sanitize";
import { EventEmitter } from "events";

const __dirname = path.resolve();

const dbUrl = "mongodb://127.0.0.1:27017/prosperaviva";

mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serving on port ${PORT}`);
});
