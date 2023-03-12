const express = require("express");
const app = express();
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const multer = require("multer");
const path = require("path");
const sanitizer = require("express-sanitizer");
const methodOverride = require("method-override");
const localStrategy = require("passport-local");
const MongoStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const crypto = require("crypto");
const User = require("./models/user");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const bookRoutes = require("./routes/books");
const authRoutes = require("./routes/auth");
const db =
  "mongodb+srv://sanya:" +
  process.env.DB_PASSWORD +
  "@cluster0.urst6zi.mongodb.net/?retryWrites=true&w=majority";

// const Seed = require("./seed");

// uncomment below line for first time to seed database;
// Seed(1000);

if (process.env.NODE_ENV !== "production") require("dotenv").config();

// app config
app.engine(".html", ejs.renderFile);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "views"));

app.use(methodOverride("_method"));

app.use(express.static(__dirname + "/public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizer());

// db config
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB is connected"))
  .catch((error) => console.log(error));

//PASSPORT CONFIGURATION

const store = new MongoStore({
  uri: db,
  collection: "sessions",
});

app.use(
  session({
    //must be declared before passport session and initialize method
    secret: 2y$12$nNYIs5iStm9gAsdgDGv3l.OyZN3Reav7U.YfwYW/L/171cjIHgjbm,
    saveUninitialized: true,
    resave: true,
    store,
  })
);

app.use(flash());

app.use(passport.initialize()); //must declared before passport.session()
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// configure image file storage
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, `${crypto.randomBytes(12).toString("hex")}-${file.originalname}`);
  },
});

const filefilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(
  multer({ storage: fileStorage, fileFilter: filefilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.warning = req.flash("warning");
  next();
});

//Routes
app.use(userRoutes);
app.use(adminRoutes);
app.use(bookRoutes);
app.use(authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});
