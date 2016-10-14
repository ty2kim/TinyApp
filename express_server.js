const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt-nodejs');
const _ = require('lodash');

const PORT = process.env.PORT || 8080; // default port 8080

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false })); // forms
app.use(bodyParser.json()); // JSON
app.use(cookieSession({
  keys: ['user_id'],
}));

let urlDatabase = {};
let users = {};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/urls', (req, res) => {
  const userId = req.session.user_id;
  let renderURLs = {};
  let templateVars = {
    DB: urlDatabase,
    email: '',
    cookie: false,
  };
  if (users[userId]) {
    templateVars.email = users[userId].email;
    renderURLs[userId] = urlDatabase[userId];
    templateVars.DB = renderURLs;
    templateVars.cookie = true;
  }

  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const userId = req.session.user_id;
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
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!userId) {
    userId = _.findKey(urlDatabase, shortURL);
  }

  const longURL = urlDatabase[userId][shortURL];
  res.redirect(longURL);
});

app.get('/register', (req, res) => {
  res.render('urls_register');
});

app.get('/login', (req, res) => {
  res.render('urls_login');
});

app.post('/urls', (req, res) => {
  const userId = req.session.user_id;
  const randomShortURL = generateRandomString();
  if (!urlDatabase[userId]) {
    urlDatabase[userId] = {};
  }

  urlDatabase[userId][randomShortURL] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;
  urlDatabase[userId][shortURL] = newLongURL;
  res.redirect('/urls');
});

app.post('/urls/:id/delete', (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  delete urlDatabase[userId][shortURL];
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId = _.findKey(users, ['email', email]);
  if (userId && bcrypt.compareSync(password, users[userId].password)) {
    req.session.user_id = userId;
  } else {
    res.status(403);
  }

  res.redirect('/');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userRandomId = generateRandomString();
  const userId = _.findKey(users, ['email', email]);
  if (email && password && !userId) {
    const hashedPassword = bcrypt.hashSync(password);
    users[userRandomId] = { id: userRandomId, email: email, password: hashedPassword };
    req.session.user_id = userRandomId;
    res.redirect('/');
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
