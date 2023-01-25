require("dotenv").config()
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// sesions and cookies
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// OAuth 
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");


// const encrypt = require("mongoose-encryption")
// hashing the passwords
// const md5 = require("md5");
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const app = express();
// hashing
// console.log(md5("12456"));
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Session set up 
app.use(session({
    secret : 'Our little secret',
    resave : false,
    saveUninitialized : true,
}));
// passport set up first initialize it to use authentication
app.use(passport.initialize());
app.use(passport.session());


// mongoose connection to mongodb
mongoose.set("strictQuery", true)
mongoose.connect("mongodb://0.0.0.0/userDB", { useNewUrlParser: true });

// schema  
// const userSchema = {
//     email : String,
//     password : String
// };

//use mongoose encrption module
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId : String,
    secret : String
});

// set passport-local-mongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// const secret = "Thisisourlittlesecret.";
// // for enviroment varible security move the secret key or the variable which we use for encyption into .env file
// userSchema.plugin(encrypt, {secret : process.env.SECRET, encryptedFields : ["password"]});

//model
const User = new mongoose.model("User", userSchema);
// method of passport-local-mongoose
passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// use this method for all strategy 
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

// Passport.js and passport-google-oauth20 strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//

app.get("/", function (req, res) {
    res.render("home")
});
// OAuth 
app.get("/auth/google", 
    passport.authenticate("google", {scope : ["profile"]})
);

// oauth and passport.js
app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });



app.get("/login", function (req, res) {
    res.render("login")
});
app.get("/register", function (req, res) {
    res.render("register")
});
// use sesssion and coockies modules
app.get("/secrets", function(req, res){
    // if(req.isAuthenticated()){
    //     res.render("secrets");
    // } else {
    //     res.redirect("/login");
    // }
     User.find({"secret" : {$ne : null}}, function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                res.render("secrets", {usersWithSecrets : foundUser});
            }
        }
     } );
});
// Submit page
app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})
app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    console.log(req.user.id);
    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
});
// log out session
app.get("/logout", function(req, res){
    // req.logout();
    req.logout(function(err) {
        if (!err) {
            res.redirect("/");
        }
    });
});
  

app.post("/register", function (req, res) {
    // use bcrypt module
    // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     newUser.save(function (err) {
    //         if (err) {
    //             console.log(err);
    //         } else {
    //             res.render("secrets")
    //         }
    //     });
    // });
    // const newUser = new User({
    //     email: req.body.username,
    //     // password: req.body.password
    //     // hashing 
    //     password: md5(req.body.password)

    // });
    // newUser.save(function (err) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         res.render("secrets")
    //     }
    // });

    // use sesssion and coockies modules
    User.register({username:req.body.username},req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            })
        }
    });
});

app.post("/login", function (req, res) {
    // const username = req.body.username;
    // // const password = req.body.password;
    // //hashing 
    // // const password = md5(req.body.password);
    // // bcrypt
    // const password = req.body.password;
    // // bcrpt
    // User.findOne({ email: username }, function (err, foundUser) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         if (foundUser) {
    //             bcrypt.compare(password, foundUser.password, function (err, result) {
    //                 if (result === true) {
    //                     res.render("secrets");
    //                 }
    //             });
    //         }
    //     }
    // });
    // hashing
    //     User.findOne({ email: username }, function (err, foundUser) {
    //         if (err) {
    //             console.log(err);
    //         } else {
    //             if (foundUser) {
    //                 if (foundUser.password === password) {
    //                     res.render("secrets")
    //                 }
    //             }
    //         }
    //     })


    // use sesssion and coockies modules
    const user = new User({
        username : req.body.username,
        password : req.body.passport
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});



app.listen(3000, function () {
    console.log("Server started on port 3000");
});