const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 8080; // default port 8080

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false })); // forms
app.use(bodyParser.json()); // JSON
app.use(cookieParser());

let urlDatabase = {
  // 'randUserId' :
  //        { 'b2xVn2': 'http://www.lighthouselabs.ca',
  //          '9sm5xK': 'http://www.google.com'}
};

let users = {};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  let userId = req.cookies.user_id;
  let email = '';
  if (users[userId]) {
    email = users[userId].email;
  }

  let templateVars = {
    urls: urlDatabase,
    email: email,
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let userId = req.cookies.user_id;
  if (users[userId]) {
    res.render('urls_new');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:id', (req, res) => {
  let templateVars = { shortURL: req.params.id };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get('/register', (req, res) => {
  res.render('urls_register');
});

app.get('/login', (req, res) => {
  res.render('urls_login');
});

app.post('/urls', (req, res) => {
  let randomShortURL = generateRandomString();
  urlDatabase[randomShortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  let shortURL = req.params.id;
  let newLongURL = req.body.longURL;
  urlDatabase[shortURL] = newLongURL;
  res.redirect('/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  let shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let matchExists = false;
  for (user in users) {
    if (users[user].email == email && users[user].password == password) {
      matchExists = true;
      res.cookie('user_id', user);
      break;
    }
  }

  if (!matchExists) {
    res.status(403);
  }

  res.redirect('/');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/');
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userRandomId = generateRandomString();
  if (email && password) {
    let emailExists = false;

    for (user in users) {
      if (users[user].email == email) {
        emailExists = true;
      }
    }

    if (!emailExists) {
      users[userRandomId] = { id: userRandomId, email: email, password: password };
      res.cookie('user_id', userRandomId);
      res.redirect('/');
    } else {
      res.status(400);
      res.redirect('/login');
    }

  } else {
    res.status(400);
    res.redirect('/login');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  const length = 6;
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (var i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}
