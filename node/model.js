var firebase = require('./firebase');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var STATUSES = {editing: "EDITING", saved: "SAVED"};

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

function makeChunk(author, text, chunkId) {
  return {author:author, content:{text:text}, status:STATUSES.saved, chunkId:chunkId};
}

exports.submitChunk = function(username, text, chunkId, previousChunkId, callback) {
  var chunk = makeChunk(username, text, chunkId);
  firebase.addChunk(chunk, function(chunkId, error) {
    if (error) {
      callback(error);
      return;
    }
    firebase.insertChunk(chunkId, previousChunkId, function(error) {
      if (error) {
        callback(error);
        return;
      }
      callback(false);
    });
  });
}

function compileChunks(order, chunks) {
  var compiledChunks = {};
  for (var chapterKey in order) {
    var chapterList = [];
    var chapter = order[chapterKey];
    for (var i = 0; i < chapter.length; i++) {
      var chunk = chunks[chapter[i]];
      if (chunk) {
        chapterList.push(chunk);
      }
    }
    compiledChunks[chapterKey] = chapterList;
  }
  return compiledChunks;
}

exports.getAllChunks = function(callback) {
  firebase.getChunks(function(chunks) {
    if (!chunks) {
      callback("No chunks found ... strange.");
      return;
    }
    firebase.getLatestOrder(function(latestOrder) {
      if (!latestOrder) {
        callback("Latest order was not found.");
        return;
      }
      callback(compileChunks(latestOrder, chunks));
    });
  });
}

exports.findUser = firebase.findUser;
exports.updateUserStatus = firebase.updateUserStatus;
exports.userList = firebase.userList;
