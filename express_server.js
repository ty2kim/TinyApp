const express = require('express');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8080; // default port 8080

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false })); // forms
app.use(bodyParser.json()); // JSON

var urlDatabase = {
  //'b2xVn2': 'http://www.lighthouselabs.ca',
  //'9sm5xK': 'http://www.google.com'
};

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/urls/:id', (req, res) => {
  let templateVars = { shortURL: req.params.id };
  res.render('urls_show', templateVars);
});

app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
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
