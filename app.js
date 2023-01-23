require("dotenv").config()
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const encrypt = require("mongoose-encryption")

const app = express();
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

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
    password: String
});

// const secret = "Thisisourlittlesecret.";
// for enviroment varible security move the secret key or the variable which we use for encyption into .env file
userSchema.plugin(encrypt, {secret : process.env.SECRET, encryptedFields : ["password"]});

//model
const User = new mongoose.model("User", userSchema);



app.get("/", function (req, res) {
    res.render("home")
});
app.get("/login", function (req, res) {
    res.render("login")
});
app.get("/register", function (req, res) {
    res.render("register")
});


app.post("/register", function (req, res) {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.render("secrets")
        }
    });
});

app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({ email: username }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("secrets")
                }
            }
        }
    })
})



app.listen(3000, function () {
    console.log("Server started on port 3000");
});