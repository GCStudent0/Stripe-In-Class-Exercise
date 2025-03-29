require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var courseRouter = require('./routes/courseRoutes');
var usersRouter = require('./routes/users');
var paymentsRouter = require('./routes/paymentRoutes');
var ordersRouter = require('./routes/orderRoutes');
var hbs = require("hbs");

var app = express();

// Import mongoose and configs object
var mongoose = require("mongoose");
var configs = require("./configs/global");

// Add session middleware
var session = require('express-session');
app.use(session({
  secret: 'onlinelearningplatformwebapp',
  resave: false,
  saveUninitialized: true
}));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Middleware for logging, JSON parsing, and cookies
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

//Allow hbs views to access user by placing before routes so it can show up in nav bar when logged in
app.use((req, res, next) => {
  res.locals.userId = req.session.userId || null;
  res.locals.email = req.session.email || null;
  next();
});

// Route handling
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/courses', courseRouter);
app.use('/payments', paymentsRouter);
app.use('/orders', ordersRouter);

// Connect to mongoose
mongoose.connect(configs.ConnectionStrings.MongoDB)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.log("Error connecting to MongoDB", error));

// Catch 404 errors
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  // Set locals for error handling in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render error page
  res.status(err.status || 500);
  res.render('error');
});

hbs.registerHelper('truncateDesc', function (str, length) {
  if (str.length > length) {
    return str.substring(0, length) + '...';
  }
  return str;
});

module.exports = app;
