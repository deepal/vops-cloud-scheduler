
module.exports = function(){

    var db = require('../db');
    var User = require('../db/schemas/dbUser');
    var UserSession = require('../db/schemas/dbSession');
    //var md5 = require('MD5');
    var response = require('../../config/responseMessages');
    var crypto = require('crypto');
    var shasum = crypto.createHash('sha1');

    var login = function (username, password, callback) {

        //check whether given username and password match any of the users in the dbUser collection
        User.findOne({ username: username }).exec(function (err, userObj) {
            if(err){
                callback(response.error(500, "Database Error occurred !", err));
            }
            else{
                if(userObj){
                    var hPassword = getShaHash(password + userObj._id.getTimestamp());
                    if(userObj.password == hPassword){
                        //userObj.loginTime = Date.now();         //include login time in the user object to create a unique session key
                        var sessionKey = getShaHash(JSON.stringify(userObj)+Date.now());  //create unique session key from stringified user object

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
                    callback(response.error(200, "Username or Password Invalid!"));
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
                        password: getShaHash(userObj.password + objID.getTimestamp()),
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
    };

    var authorizeResourceRequest = function (userRequest, callback) {
        // query dbSessions schema and authorize the request. Return the prioritized request
        if(userRequest.session_id){
            var sessionKey = userRequest.session_id[0];
            if(!sessionKey){
                callback({
                    status: 'Error',
                    code: 403,
                    message: 'Unauthorized request'
                });
            }
            else{
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

                            if(parseInt(sessionObj.userPriority) < parseInt(userRequest.group[0].priority[0])){
                                callback(response.error(403, ERROR.REQUEST_PRIORITY_NOT_AUTHORIZED));
                            }
                            else{
                                callback(null, {
                                    session: sessionObj,
                                    requestContent: userRequest
                                });
                            }



                        }
                        else{
                            callback(response.error(403, ERROR.NOT_LOGGED_IN, err));
                        }
                    }
                });
            }
        }
        else{
            callback(response.error(403, ERROR.SESSION_KEY_MISSING_IN_REQUEST));
        }


    };

    var getShaHash = function (str) {
        return crypto.createHash('sha256').update(str).digest('hex')
    };

    return {
        login: login,
        createUser: createUser,
        authorizeResourceRequest: authorizeResourceRequest
    }

};
