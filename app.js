var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var session = require('express-session');
var config = require('./config/config.json');

var index = require('./routes/index');
var users = require('./routes/users');
var classes = require('./routes/api/classes');
var languages = require('./routes/api/languages');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: config.session.secret, resave: false, saveUninitialized: true, cookie: {maxAge: config.session.duration.maxAge }}));

app.use('/', index);
//use JWT auth on all routes except the ones specified
app.use('/', expressJwt({ secret: config.session.secret}).unless({path: config.exempted_routes}));

app.use('/users', users);
app.use('/classes', classes);
app.use('/languages', languages);

//app.use('/', expressJwt({secret: config.session.secret}));
// error handler
app.use(function(err, req, res, next) {
  console.log(err);
  res.status(err.status).send({error_message: err.message});
});

module.exports = app;
