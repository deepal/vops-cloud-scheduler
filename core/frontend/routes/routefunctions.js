var resError = function(res, msg){
    res.send({
        result: "error",
        message: msg
    });
}

var resSuccess = function(res, msg){
    res.send({
        result: "success",
        message: msg
    });
}

var home = function (req, res) {
    console.log("Express server got a request");
    resSuccess(res, "Resource scheduler is up and running")
}

var webUI = function (req, res) {
    var requestAttrs = ATTRS;
    res.render('request', {title: 'Submit a resource request', attrs: requestAttrs});
}

var submitWebRequest = function (req, res) {
    console.log("request received");
    res.send("Your request received!");
}

var submitAPIRequest = function (req, res, zSession) {
    console.log(JSON.stringify(req.body.resource_request));
    var scheduler = require('../../scheduler/vmScheduler')(zSession);
    scheduler.requestForAllocation(req.body.resource_request, function(status, responseMessage){
        res.send(status, responseMessage);
    });
}

var adminCreateUser = function(req, res){
    var authService = require('../../auth/authService')();
    authService.createUser(req.body, function (err, response) {
        res.send(response);
    });
}

var login = function (req, res) {
    var authService = require('../../auth/authService')();
    var response = require('../../../config/responseMessages');
    authService.login(req.body.username, req.body.password, function (err, sessionID) {
        if(err){
            res.send(err);
        }
        else{
            res.send(response.success(200, 'Login successful', { sessionID: sessionID}));
        }
    });
}

var configWrite = function(req, res){
    res.send("")
}

var configRead = function (req, res) {
    res.send("");
}

module.exports = {
    resError: resError,
    resSuccess: resSuccess,
    home: home,
    webUI: webUI,
    submitWebRequest: submitWebRequest,
    submitAPIRequest: submitAPIRequest,
    adminCreateUser: adminCreateUser,
    login: login,
    configWrite: configWrite,
    configRead: configRead
}
