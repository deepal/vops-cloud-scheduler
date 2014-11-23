/*
This module provides authentication service for Resource scheduler
 */

module.exports = function(){

    var db = require('../db');
    var User = require('../db/schemas/dbUser');
    var UserSession = require('../db/schemas/dbSession');
    var md5 = require('MD5');

    var login = function (username, password, callback) {

        //check whether given username and password match any of the users in the dbUser collection
        User.findOne({ username: username }).exec(function (err, userObj) {
            if(err){
                callback({
                    status: 'Error',
                    code: 500,
                    error: err
                });
            }
            else{
                if(userObj){
                    var hPassword = md5(password + userObj._id.getTimestamp());
                    if(userObj.password == hPassword){
                        //userObj.loginTime = Date.now();         //include login time in the user object to create a unique session key
                        var sessionKey = md5(JSON.stringify(userObj)+Date.now());  //create unique session key from stringified user object

                        var Session = require('../db/schemas/dbSession');
                        var newSession = new Session({
                            //_id: userObj._id,      // This key is removed since a user may have multiple sessions
                            username: userObj.username,
                            sessionID: sessionKey,
                            userPriority: userObj.priority,
                            admin: userObj.admin
                        });

                        //save newly created session in the database
                        newSession.save(function (err) {
                            if(err){
                                throw err;
                                //callback({
                                //    status: 'Error',
                                //    code: 500,
                                //    error: err
                                //});
                            }
                            else{
                                callback(null, sessionKey);
                            }
                        });
                    }
                    else{
                        callback({
                            status: 'Error',
                            message: 'Username or Password invalid!'
                        });
                    }
                }
                else{
                    callback({
                        status: 'Error',
                        message: 'No such user exists!'
                    });
                }
            }
        });

    }

    /*
    In createUser function, 'userObj' should be structured as follows:

                    {
                        username: String,
                        password: String,
                        userInfo: Object,
                        priority: Number,
                        admin: Boolean
                    }

     */

    var createUser = function (userObj, callback) {
        User.findOne({ username: userObj.username}).exec(function (err, user) {
            if(err){
                callback({
                    status: 'Error',
                    code: 500,
                    error: err
                });
            }
            else{
                if(user){
                    callback({
                        status: 'Error',
                        message: 'Username is used in an existing account. Try a different username !'
                    });
                }
                else{
                    var objID = (require('mongoose')).Types.ObjectId();
                    var newUser = new User({
                        _id: objID,
                        username: userObj.username,
                        password: md5(userObj.password + objID.getTimestamp()),
                        userInfo: userObj.userInfo,
                        priority: userObj.priority,
                        admin: userObj.admin
                    });
                    newUser.save(function (err) {
                        if(err){
                            callback({
                                status: 'Error',
                                code: 500,
                                error: err
                            });
                        }
                        else{
                            callback(null, {
                                status: 'Success',
                                userID: objID,
                                message: 'User account was created successfully !'
                            });
                        }
                    });
                }
            }
        });
    }

    var authorizeResourceRequest = function (userRequest, callback) {
        // query dbSessions schema and authorize the request. Return the prioritized request
        var sessionKey = userRequest.sessionID;

        if(!sessionKey){
            callback({
                status: 'Error',
                code: 403,
                message: 'Unauthorized request'
            });
        }

        UserSession.findOne({ sessionID: sessionKey }).exec(function (err, sessionObj) {
            if(err){
                callback({
                    status: 'Error',
                    code: 500,
                    error: err
                });
            }
            else{
                if(sessionObj){
                    callback(null, {
                        userPriority: sessionObj.userPriority,
                        requestContent: userRequest
                    });
                }
                else{
                    callback({
                        status: 'Error',
                        message: 'Please login first !',
                        errorObject: err
                    });
                }
            }
        });
    }

    //var adminRequestAuthorize = function (adminRequest, callback) {
    //    if(!adminRequest.sessionID){
    //        UserSession.find({ sessionID: adminRequest.sessionID }).exec(function (err, sessionObj) {
    //            if(err){
    //                callback({
    //                    status: 'Error',
    //                    code: 500,
    //                    error: err
    //                });
    //            }
    //            else{
    //                if(sessionObj){
    //                    if(sessionObj.admin){
    //                        callback(null, {
    //                            admin: true,
    //                            requestContent: adminRequest
    //                        });
    //                    }
    //                    else{
    //                        callback({
    //                            admin: false,
    //                            requestContent: adminRequest
    //                        });
    //                    }
    //                }
    //                else{
    //                    callback({
    //                        status: 'Error',
    //                        code: 403,
    //                        error: 'Unauthorized request!'
    //                    });
    //                }
    //            }
    //        });
    //    }
    //}

    return {
        login: login,
        createUser: createUser,
        authorizeResourceRequest: authorizeResourceRequest
    }

}
