const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt-nodejs');
const _ = require('lodash');
const methodOverride = require('method-override');

const PORT = process.env.PORT || 8080; // default port 8080

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false })); // forms
app.use(bodyParser.json()); // JSON
app.use(cookieSession({
  keys: ['user_id'],
}));
app.use(methodOverride('_method'));

let urlDatabase = {};
let users = {};

app.get('/', (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  const userId = req.session.user_id;
  let templateVars = {
    urls: urlDatabase,
    userId: '',
    email: '',
  };
  if (userId) {
    templateVars.userId = userId;
    templateVars.email = users[userId].email;
    res.status(200);
    res.render('urls_index', templateVars);
  } else {
    res.status(401);
    res.render('urls_notfound', { message: 'User is not logged in.', link: 'login', code: 401, });
  }
});

app.get('/urls/new', (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    let templateVars = {
      userId: userId,
      email: users[userId].email,
    };
    res.status(200);
    res.render('urls_new', templateVars);
  } else {
    res.status(401);
    res.render('urls_notfound', { message: 'User is not logged in.', link: 'login', code: 401, });
  }
});

app.get('/urls/:id', (req, res) => {
  const userId = req.session.user_id;
  const url = req.params.id;
  if (!_.findKey(urlDatabase, url)) {
    res.status(404);
    res.render('urls_notfound', { message: `${url} does not exist`, link: '', code: 404, });
  } else if (!userId) {
    res.render('urls_notfound', { message: 'User is not logged in.', link: 'login', code: 401, });
  } else if (_.findKey(urlDatabase, url) != userId) {
    res.status(403);
    res.render('urls_notfound', { message: 'Logged in user does not match the user that owns this url', link: '', code: 403, });
  } else {
    res.status(200);
    let templateVars = { shortURL: url };
    res.render('urls_show', templateVars);
  }
});

app.get('/u/:shortURL', (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const key = _.findKey(urlDatabase, shortURL);
  if (key) {
    const longURL = urlDatabase[key][shortURL];
    res.redirect(longURL);
  } else {
    res.status(404);
    res.render('urls_notfound', { message: `${shortURL} does not exist`, link: '', code: 404, });
  }
});

app.get('/register', (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect('/');
  } else {
    res.status(200);
    res.render('urls_register');
  }
});

app.get('/login', (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect('/');
  } else {
    res.status(200);
    res.render('urls_login');
  }
});

app.post('/urls', (req, res) => {
  const userId = req.session.user_id;
  const randomShortURL = generateRandomString();
  if (userId) {
    if (!urlDatabase[userId]) {
      urlDatabase[userId] = {};
    }

    urlDatabase[userId][randomShortURL] = req.body.longURL;
    res.redirect(`/urls/${randomShortURL}`);
  } else {
    res.status(401);
    res.render('urls_notfound', { message: 'User is not logged in.', link: 'login', code: 401, });
  }
});

app.post('/urls/:id', (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;
  const key = _.findKey(urlDatabase, shortURL);
  if (!key) {
    res.status(404);
    res.render('urls_notfound', { message: `${shortURL} does not exist`, link: '', code: 404, });
  } else if (!userId) {
    res.render('urls_notfound', { message: 'User is not logged in.', link: 'login', code: 401, });
  } else if (_.findKey(urlDatabase, shortURL) != userId) {
    res.status(403);
    res.render('urls_notfound', { message: 'Ristricted access', link: '', code: 403, });
  } else {
    urlDatabase[userId][shortURL] = newLongURL;
    res.redirect(`/urls/${shortURL}`);
  }
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
    res.redirect('/');
  } else {
    res.status(401);
    res.render('urls_notfound', { message: 'No matching email & password', link: '', code: 401 });
  }
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
  if (!email || !password) {
    res.status(400);
    res.send('Email or password are empty');
  } else if (userId) {
    res.status(400);
    res.send('Email already exist');
  } else {
    const hashedPassword = bcrypt.hashSync(password);
    users[userRandomId] = { id: userRandomId, email: email, password: hashedPassword };
    req.session.user_id = userRandomId;
    res.redirect('/');
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
