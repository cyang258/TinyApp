
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080
const bodyParser = require("body-parser");
const methodOveride = require("method-override");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.use(methodOveride('_method'));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "cookieSession",
  secret: "abcdefg",
  maxAge: "99999"
}))

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function checkPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateRandomString() {
  return Math.random().toString(36).replace(/[^A-Za-z0-9]/g, '').substr(0, 6);
}

function findUser(id) {
  for (key in users) {
    if(users[key].id === id) {
      return users[key];
    }
  }
}

function registerUser(email, password) {
  for(key in users) {
     if(users[key].email === email) {
      return null;
     }
  }
    var newUserId = generateRandomString();
    users[newUserId] = {
      id: newUserId,
      email: email,
      password: bcrypt.hashSync(password, 10)
    };
    return newUserId;
}

function authenticateUser(email, password) {
  for(key in users) {
    if (users[key].email === email && checkPassword(password, users[key].password)) {
      return users[key];
    }
  }
  return null;
}



const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: hashPassword("purple-monkey-dinosaur")
  },

  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: hashPassword("dishwasher-funk")
  }

}

var urlDatabase = {
  userRandomID:{
   "b2xVn2": "http://www.lighthouselabs.ca",
   "9sm5xK": "http://www.google.com"
  },
  user2RandomID:{
   "b2xVn2": "http://www.lighthouselabs.ca",
   "9sm5xK": "http://www.google.com"
  }
};


app.get("/register", (req, res) => {
  res.render("user_registration")
})

app.post("/register_submit", (req, res) => {
  // Search through database to check if email has already been used
  const { email, password } = req.body;
  const userId = registerUser(email, password);
  if(userId) {
    urlDatabase[userId]={};
    req.session.userId = userId;
    res.redirect("/urls");
  } else {
    res.status(400).send("This Email has been used, Please register with a new one")
  }
});

app.get("/login_page", (req, res) => {
  res.render("user_login", {message: null});
});

app.post("/login_submit", (req, res) => {
  const { email, password } = req.body;
  const user = authenticateUser(email, password);
  if(user) {
    req.session.userId = user.id;
    res.redirect("/urls")
  } else {
    res.render("user_login",{message:"You Entered Wrong Email or Password, Please Try Again"})
  }
});

app.get("/urls/new", (req, res) => {
  const user = findUser(req.session.userId);
  if(user){
  res.render("urls_new", { user: user});
  } else {
    res.redirect("/login_page");
  };
});

app.post("/urls", (req, res) => {
  const user = findUser(req.session.userId);
  let userId = user.id;
  var shortURL = generateRandomString();
  urlDatabase[userId][shortURL] = req.body.longURL;
  res.redirect("/urls/");
});

app.get("/u/:shortURL", (req, res) => {
  const user = findUser(req.session.userId);
  let longURL = null;

  for(let userId in urlDatabase){
    // console.log(Object.keys(urlDatabase[userId]))
    for(let url in urlDatabase[userId]){
      if(url === req.params.shortURL){
        longURL = urlDatabase[userId][req.params.shortURL];
      }
    }
  }
  if (longURL) { res.redirect(longURL); }
  else { res.status(404); }

})

app.get("/urls", (req, res) => {
  var user = findUser(req.session.userId);
  if(user){
    let templateVars = {
      urls: urlDatabase[user.id],
      user: user
    };
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_index");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
})

app.get("/urls/:id", (req, res) => {
  const user = findUser(req.session.userId);
  let userId = user.id;
  let templateVars = {
    user: user,
    shortURL: req.params.id,
    fullURL: urlDatabase[userId][req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.put("/urls/:id/put", (req, res) => {
  const user = findUser(req.session.userId);
  let userId = user.id;
  urlDatabase[user][req.params.id] = req.body.fullURL;
  res.redirect('/urls')
})

app.delete("/urls/:id/delete", (req, res) => {
  const user = findUser(req.session.userId);
  let userId = user.id;
  delete urlDatabase[user][req.params.id];
  res.redirect("/urls");
})

app.get("/",(req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n")
});

app.listen(PORT, () => {
  console.log(`example app listening on port ${PORT}!`);
});