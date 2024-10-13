import express from "express";
import mongoose from "mongoose";
import ejsMate from "ejs-mate";
import session from "express-session";
import path from "path";
import flash from "connect-flash";
import ExpressError from "./utils/ExpressError.js";
import methodOverride from "method-override";
import passport from "passport";
import LocalStrategy from "passport-local";
import User from "./models/user.js";
import helmet from "helmet";

import MongoStore from "connect-mongo";
import mongoSanitize from "express-mongo-sanitize";

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
});

store.on("error", function (e) {
    console.log("Session Store Error", e);
});

const sessionConfig = {
    store,
    name: "session",
    secret,
    resave: false,
    saveUnlimited: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};

app.use(session(sessionConfig));
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

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "public/index.html"));
})

app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something went wrong!";
    res.status(statusCode).render("error", { err });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});
