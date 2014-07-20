var firebase = require('./firebase');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');

var RETRO_BOT = "Jeremy L";
var FAKE_USERS = [RETRO_BOT, "Evelyn K", "Ben F", "Karl L", "Jackie S", "Charles W", "Felix S", "Ralph C", "Al T", "Samuel S", "Trevor R", "Kevin Z", "Kevin C", "Michael R", "Caroline R", 
    "Stephanie W", "Janet C", "Bob D", "Mike B", "Carl J", "Claire S", "Eddy T", "Eric R",
    "Bobby E", "Larry G"];

var timestamp = 0;
var BUFFER_TIME = 5 * 1000;
var TICK_INTERVAL = 2 * 1000;
var LONELY_INTERVAL = 20 * 1000;
var DELAY_ALLOWANCE = 5;
var QUEUE_LENGTH_CUTOFF = 8;

var currentStreak = 0;
var currentUser = "";

var isSwitching = false;

function initialize() {
  timestamp = (new Date()).getTime();
}
initialize();


exports.localStrategy = new LocalStrategy(function(username, password, callback) {
  firebase.getUser(username, function(err, user) {
    if (user) {
      bcrypt.compare(password, user.pwHash, function(err, authenticated) {
        if (authenticated) {
          callback(null, user);
        } else {
          callback(null, false);
        }
      });
    } else {
      callback(null, false);
    }
  });
});

exports.createUser = function(username, password, passwordconfirm, callback) {
  if(/[^a-zA-Z0-9_]/.test(username)) {
    callback('Invalid characters in username');
    return;
  }
  if (password !== passwordconfirm) {
    callback('Passwords don\'t match');
    return;
  }
  firebase.getUser(username, function(err, user) {
    if (user) {
      callback('Username already exists');
    } else {
      firebase.createUser(username, bcrypt.hashSync(password, 10), function(err) {
        callback(err);
      });
    }
  });
}

exports.findUser = firebase.findUser;
exports.updateUserStatus = firebase.updateUserStatus;
exports.userList = firebase.userList;
