let App = require('./App/App');
const express = require('express');
const body_parser = require('body-parser')
const app = express();
const port = 3000;

app.use(body_parser.json());

App.app = app;

App.custom_util = require("./custom_util");

const UserGame = require('./routes/usergame').UserGame;

let usergame = new UserGame().listen(App);

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port,() => console.log(`Example app listening on port ${port}!`));