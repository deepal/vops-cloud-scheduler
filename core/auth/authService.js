/*
This module provides authentication service for Resource scheduler
 */

module.exports = function(){

    var login = function (username, password) {
        var md5 = require('MD5');
        var hPassword = md5(password);
    }

    var authorizeResourceRequest = function (sessionKey, userRequest, callback) {
        // query dbSessions schema and authorize the request. Return the
    }

    var adminRequestAuthorize = function (sessionKey, adminRequest, callback) {

    }

    return {
        login: login,
        authorizeResourceRequest: authorizeResourceRequest,
        adminRequestAuthorize: adminRequestAuthorize
    }

}
