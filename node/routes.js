var model = require('./model');
var authConfig = require('./authConfig.js');

exports.initialRouter = function(req, res, next) {
  if (req.url === '/login' || (req.url.lastIndexOf('/auth/facebook', 0) === 0) ||
      req.url === '/loggedin' || req.url === '/') {
    next();
  } else if (req.user) {
    console.log(req.user.username + " " + req.url);
    model.userList[req.user.username] = true;
    next();
  } else {
    res.redirect('/');
  }
};

exports.localStrategy = model.localStrategy;

exports.findUser = model.findUser;

exports.root = function(req, res) {
  if (req.user) {
    res.render('index.html', {user: req.user.username});
  } else {
    res.render("login.html");
  }
}

exports.viewer = function(req, res) {
  if (req.user) {
    res.render('index.html', {user: req.user.username});
  } else {
    res.redirect('/');
  }
};

exports.login = function(req, res) {
  if (req.user) {
    res.redirect('/');
  } else {
    res.render('login.html');
  }
};

exports.logout = function(req, res) {
  req.session.regenerate(function() {
    req.logout();
    res.redirect('/');
  });
}

exports.getFirebase = function(req, res) {
  var url = authConfig.firebaseURL;
  res.writeHead(200, {
    'Content-Length': url.length,
    'Content-Type': 'text/plain' })
  res.write(url);
  res.end();
}


exports.isLoggedIn = function(req, res) {
  var loggedIn = "no";
  if(req.user) {
    var loggedIn = "yes";
  }
  res.writeHead(200, {
    'Content-Length': loggedIn.length,
    'Content-Type': 'text/plain' })
  res.write(loggedIn);
  res.end();
}
