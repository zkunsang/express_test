let App = require('./App/App');
const express = require('express');
const body_parser = require('body-parser')
const app = express();
const port = 3000;

app.use(body_parser.json());

App.app = app;

App.custom_util = require("./custom_util");

const Router = require('./routes').Router;

Router.service(App, Router.route(App)).listen();

app.listen(port,() => console.log(`Example app listening on port ${port}!`));