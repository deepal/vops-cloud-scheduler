module.exports = function(){
    var validateAdmin = function(sessionID, callback){
        var db = require('../db');
        var UserSession = require('../db/schemas/dbSession');

        UserSession.findOne({ sessionID: sessionID }).exec(function (err, sessionObj) {
            if(err){
                callback({
                    status: 'Error',
                    code: 500,
                    error: err
                });
            }
            else{
                if(sessionObj){
                    if(sessionObj.admin){
                        callback(null, {
                            admin: true,
                            sessionID: sessionID
                        });
                    }
                }
                else{
                    callback({
                        status: 'Error',
                        error: 'Unauthorized request !'
                    });
                }
            }
        });
    }

    return {validateAdmin: validateAdmin};
}
