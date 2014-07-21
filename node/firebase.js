/* Functions that interact with Firebase */

var Firebase = require('firebase');
var authConfig = require('./authConfig');
var root = new Firebase(authConfig.firebaseURL);
root.auth(authConfig.firebaseSecret);
var http = require('http');

/*
 * Schema
 *
 * storytime
 *   chunks:
 *     1:
 *      author: Victor Hung
 *      status: Saved
 *      content: 
 *        text: This is the tale of a young man named bob
 *        ups: 3
 *        downs: 2
 *     2:
 *      author: Michael Xu
 *      status: Editing
 *     ...
 *   order: [2,1]
 *   users:
 *     ???
 */
 
 
var ADMIN = {'Michael Xu': true, 
             'Victor Hung': true, 
             'Stephanie Yu': true};

// Keep track of current active users
userList = {};
exports.userList = userList;

function sanitizeUsername(username) {
  return username.replace(/[\[\]\.$#,]/g,'');
}

function hasAdminPrivileges (user) {
  console.log(user);
  console.log(user in ADMIN);
  return user in ADMIN;
}

function createUserFb(username, id, callback) {
  findUser(id, function(notFound, foundUser) {
    var cleanUsername = sanitizeUsername(username);
    if (notFound) {
      var user = {
        'id' : id,
        'username' : cleanUsername,
        'userStatus': 'new'
      };

      root.child('users').child(id).set(user);
      callback(false, user);
    } else {
      callback(false, foundUser);
    }
  });
}

function createUser(username, pwHash, callback) {
  root.child('counters').child('userID').transaction(function(userID) {
    return userID + 1;
  }, function(err, committed, data) {
    if (err) {
      callback(err);
      return;
    }
    if (!committed) {
      callback('System error: create user');
      return;
    }
    var userID = data.val();
    root.child('users').child(userID).set({
      'id': userID,
      'username': username,
      'pwHash': pwHash,
      'score' : 0,
      'userStatus': 'new'
    });
    callback(false);
  });
};

function getUser(username, callback) {
  root.child('users').once('value', function(data) {
    var users = data.val();
    for (var userKey in users) {
      var user = users[userKey];
      if (user.username == username) {
        callback(false, user);
        return;
      }
    }
    callback(false, false);
  });
};

function findUser(id, callback) {
  root.child('users').child(id).once('value', function(data) {
    if (data.val()) {
      callback(false, data.val());
    } else {
      console.log("User " + id + " was not found.");
      callback(true, null);
    }
  });
}

// Insert newId after prevId in chapter in order, mutates order
function insertId(order, prevId, newId) {
  var index = -1;
  for (var chapterId in order) {
    var chapter = order[chapterId];
    for (var i = 0; i < chapter.length; i++) {
      if (chapter[i] === prevId) {
        index = i;
        break;
      }
    }
    if (index !== -1) {
      chapter.splice(index, 0, newId);
      break;
    }
  }
}

// Deep copy an order
function cloneOrder(order) {
  var newOrder = {};
  for (var chapterId in order) {
    var chapter = order[chapterId];
    newOrder[chapterId] = chapter.slice(0);
  }
  return newOrder;
}

function insertChunk(chunkId, previousChunkId, callback) {
  // First increment the orderCounter, add the new updated order
  root.child('latestOrder').transaction(function(oldOrder) {
    var prevOrder = oldOrder.val();
    var newOrder = cloneOrder(prevOrder);
    insertId(newOrder, previousChunkId, chunkId);
    return newOrder;
  }, function(error, committed, snapshot) {
    if (error) {
      callback(error);
      return;
    }
    root.child('orderCounter').transaction(function(counter) {
      return counter + 1;
    }, function(error, committed, snapshot) {
      var orderId = snapshot.val();
      root.child('orders').child(orderId).set(newOrder, function(error) {
        if (error) {
          callback(error);
          return;
        }
        callback(false);
      });
    });
  });
}

function getChunks(callback) {
  root.child('chunks').once('value', function(data) {
    callback(data.val());
  });
}

function addChunk(chunk, callback) {
  root.child('chunkCounter').transaction(function(counter) {
    return counter + 1;
  }, function(error, committed, snapshot) {
    var chunkId = snapshot.val();
    if (error) {
      callback(-1, error);
      return;
    }
    root.child('chunks').child(chunkId).set(chunk);
    callback(chunkId, false);
  });
}

function updateChunkStatus(chunkId, status, callback) {
  root.child('chunks').child(chunkId).once('value', function(data) {
    if (!data.val()) {
      callback('Chunk: ' + chunkId + ' not found!');
      return;
    }
    root.child('chunks').child(chunkId).child('status').set(status);
    callback(false);
  });
}

function getLatestOrder(callback) {
  root.child('latestOrder').once('value', function(data) {
    callback(data.val());
  });
}

function getOrder(orderId, callback) {
  root.child('order').child(orderId).once('value', function(data) {
    callback(data.val());
  });
}

exports.createUserFb = createUserFb;
exports.createUser = createUser;
exports.getUser = getUser;
exports.findUser = findUser;
exports.sanitizeUsername = sanitizeUsername;
exports.insertChunk = insertChunk;
exports.getChunks = getChunks;
exports.addChunk = addChunk;
exports.updateChunkStatus = updateChunkStatus;
exports.getLatestOrder = getLatestOrder;
exports.getOrder = getOrder;
