
module.exports = function(){

    var db = require('../db');
    var User = require('../db/schemas/dbUser');
    var UserSession = require('../db/schemas/dbSession');
    var md5 = require('MD5');
    var response = require('../../config/responseMessages');

    var login = function (username, password, callback) {

        //check whether given username and password match any of the users in the dbUser collection
        User.findOne({ username: username }).exec(function (err, userObj) {
            if(err){
                callback(response.error(500, "Database Error occurred !", err));
            }
            else{
                if(userObj){
                    var hPassword = md5(password + userObj._id.getTimestamp());
                    if(userObj.password == hPassword){
                        //userObj.loginTime = Date.now();         //include login time in the user object to create a unique session key
                        var sessionKey = md5(JSON.stringify(userObj)+Date.now());  //create unique session key from stringified user object

                        //var Session = require('../db/schemas/dbSession');
                        var newSession = new UserSession({
                            //_id: userObj._id,      // This key is removed since a user may have multiple sessions
                            username: userObj.username,
                            sessionID: sessionKey,
                            userPriority: userObj.priority,
                            admin: userObj.admin
                        });

                        //save newly created session in the database
                        newSession.save(function (err) {
                            if(err){
                                callback(err)
                            }
                            else{
                                callback(null, sessionKey);
                            }
                        });
                    }
                    else{
                        callback(response.error(200, "Username or Password Invalid!"));
                    }
                }
                else{
                    callback(response.error(200, "No such user exists!"));
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
                callback(response.error(500, "Internal Server Error!", err));
            }
            else{
                if(user){
                    callback(response.error(200, "User account already exists!"));
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
                            callback(null, response.success(200, 'User account was created successfully', objID));
                        }
                    });
                }
            }
        });
    }

    var authorizeResourceRequest = function (userRequest, callback) {
        // query dbSessions schema and authorize the request. Return the prioritized request
        var sessionKey = userRequest.session_id[0];

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
                        session: sessionObj,
                        requestContent: userRequest
                    });
                }
                else{
                    callback(response.error(403, "Please login to Smart Cloud Scheduler!", err));
                }
            }
        });
    }

    return {
        login: login,
        createUser: createUser,
        authorizeResourceRequest: authorizeResourceRequest
    }

}
