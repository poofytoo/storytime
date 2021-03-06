var express = require('express');
var http = require('http');
var passport = require('passport');
var hbs = require('hbs');
var routes = require('./routes');
var firebase = require('./firebase');
var authConfig = require('./authConfig');
var FacebookStrategy = require("passport-facebook").Strategy;
var favicon = require('serve-favicon');

var app = express();

// all environments


app.set('port', authConfig.port);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

app.use(express.cookieParser());
app.use(express.logger('dev'));

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(__dirname + '/public'));
app.use(express.session({ secret: 'SECRET' }));
app.use(passport.initialize());
app.use(passport.session());

app.use(routes.initialRouter);
app.use(app.router);

passport.use(new FacebookStrategy({
    clientID: authConfig.clientID,
    clientSecret: authConfig.clientSecret,
    callbackURL: authConfig.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    firebase.createUserFb(profile.displayName, profile.id, function(error, user) {
      if (error) {
        return done(error);
      }
      done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.root);
app.get('/login', routes.login);

app.get('/viewer', routes.viewer);
app.get('/logout', routes.logout);

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/',
      failureRedirect: '/' }))

app.get('/getallchunks', routes.getAllChunks);

app.post('/submitchunk', routes.submitChunk);

http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
