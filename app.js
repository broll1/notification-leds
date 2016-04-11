/**
 * Module dependencies.
 */
var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var csrf = require('csurf');
var methodOverride = require('method-override');
var multer  = require('multer');
var exphbs = require('express-handlebars');
var helpers = require('./lib/helpers');

var _ = require('lodash');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');

/**
 * Controllers (route handlers).
 */
var homeController = require('./controllers/home');
var userController = require('./controllers/user');

/**
 * API keys and Passport configuration.
 */
var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Pushbullet, weather, and johnny-five modules
 */
var johnnyFive = require('./controllers/modules/five.js');
var pushBullet = require('./controllers/modules/pushbullet.js');

/**
 * Create Express server.
 */
var app = express();

/**
 * Connect to MongoDB.
 */
mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine("hbs", exphbs({
    defaultLayout: "main",
    extname: ".hbs",
    //helpers: require("./public/js/helpers.js").helpers, // same file that gets used on our client
    partialsDir: "views/partials/", // same as default, I just like to be explicit
    layoutsDir: "views/layouts/", // same as default, I just like to be explicit
    helpers: helpers
}));
app.set("view engine", ".hbs");
app.use(compress());
app.use(connectAssets({
  paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js')]
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer({ dest: path.join(__dirname, 'uploads') }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MongoStore({ url: secrets.db, autoReconnect: true })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  if (/api/i.test(req.path)) req.session.returnTo = req.path;
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

var csrfProtection = csrf({cookie: true});

/**
 * Primary app routes.
 */
app.get('/', csrfProtection, passportConf.isAuthenticated, homeController.index);
app.get('/login', csrfProtection, passportConf.isSystemSetupCompleted, userController.getLogin);
app.post('/login', csrfProtection, userController.postLogin);
app.get('/logout', csrfProtection, userController.logout);
app.get('/reset', csrfProtection, userController.getReset);
app.post('/reset', userController.postReset);
app.post('/setup', userController.postSignup);
app.get('/setup', userController.getSignup);
app.get('/account', csrfProtection, passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);

/**
 * Error Handler.
 */
app.use(errorHandler());
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)

  // handle CSRF token errors here
  res.status(403)
  res.send('form tampered with')
});

/**
 * Start Express server.
 */
johnnyFive.initBoard(function callback(){
    pushBullet.InitPushBullet(johnnyFive);
    app.listen(app.get('port'), function() {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
    });
});

module.exports = app;