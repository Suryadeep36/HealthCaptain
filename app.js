require('dotenv').config()
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const flash = require('connect-flash');
const port = process.env.PORT || 3000;

app.use(session({
    secret: 'cheezy_seven_pizza',
    resave: false,
    saveUninitialized: false
  }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

async function connectWeb(){
  mongoose.connect("mongodb+srv://gohilsuryadeep3101:"+process.env.PASSWORD+"@cluster0.kxhpg4c.mongodb.net?retryWrites=true&w=majority");
}
connectWeb();
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    dateOfBirth: String,
    gender: String,
    weight: String,
    height: String,
    bmi: String
})

const User = mongoose.model('User',userSchema);

passport.use(new LocalStrategy({
    usernameField: 'Email', 
    passwordField: 'password'
},
  (email, password, done) => {
    User.findOne({ email: email }, null, { maxTimeMS: 15000 }).then((data) => {
      if (!data) {
        return done(null, false, { message: 'User not found.', key: 'error' });
      }
      bcrypt.compare(password, data.password, (err, res) => {
        if (res) {
          return done(null, data);
        } else {
          return done(null, false, { message: 'Incorrect password.', key: 'error'  });
        }
      });
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
      .then(user => {
        done(null, user);
      })
      .catch(err => {
        done(err, null);
      });
  });
  
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }
  
app.get("/",(req, res) => {
    let message = req.flash('error')[0];
    if(message == "Incorrect password."){
        res.render('index',{messagePass: message, messageUser: ""})
    } 
    else if(message == "User not found."){
        res.render('index',{messagePass: "", messageUser: message})
    }
    else{
        res.render('index',{messagePass: "", messageUser: ""})
    }
    
})
app.get("/signup",(req, res) => {
    res.render('signup', {messageUser: ""});
})
app.get("/signout", (req, res) => {
  req.logOut(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})
app.get("/home" , isAuthenticated,(req, res) => {
    res.sendFile(path.join(__dirname + "/views/home.html"));
})

app.get("/BMI", isAuthenticated ,(req, res) => {
    res.render("BMI",{bmivalue: ""})
})

app.get("/aboutus",(req, res) => {
  res.sendFile(path.join(__dirname + "/views/aboutus.html"))
}) 

app.get("/profile",isAuthenticated,(req, res) => {
  console.log(req.user);
  let dateOfYear = req.user.dateOfBirth.slice(0,4);
  let age = 2024 - dateOfYear;
  res.render('profile',{username: req.user.username, age: age, height: req.user.height, weight: req.user.weight})
})
app.get("/blog", (req, res) => {
  res.sendFile(path.join(__dirname + "/views/blog.html"))
})
app.post("/BMI", isAuthenticated, async(req, res) => {
  try{
    let {weight: weight, height: height} = req.body;
    const updatedUser = await User.findOneAndUpdate({email: req.user.email},{
      $set: { height: height, weight: weight }
    },{
      new: true
    });
    let bmivalue = ((weight*100*100)/(height*height))
    bmivalue = bmivalue.toFixed(2);
    res.render("BMI",{bmivalue: bmivalue});
  }catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Internal Server Error");
}

})

app.post("/", passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/',
    failureFlash: true
  }));
  


app.post("/signup", (req, res) => {

    let {email: email, password: pass, name: name, birthdate: dateOfbirth, gender: gender} = req.body;
    bcrypt.hash(pass, 10, async(err, hash)=>{
        await User.findOne({
            email: email
        }, null, { maxTimeMS: 15000 }).then((data) => {
            if(data){
                //user already exists
                res.render('signup',{messageUser: "User already exists" })
            }
            else{
                const newUser = new User({
                    username: name,
                    email: email,
                    password: hash,
                    dateOfBirth: dateOfbirth,
                    gender: gender,
                    height: "0",
                    weight: "0"
                })
                newUser.save();
                res.redirect("/home");
            }
        })
    })

    
})

app.listen(port, () => {
    console.log("App is listening on port " + port);
})
