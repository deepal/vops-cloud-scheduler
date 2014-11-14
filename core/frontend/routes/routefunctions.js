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

var submitAPIRequest = function (req, res) {
    var scheduler = require('./core/scheduler')(req.body);
    res.send(req.body);
}

module.exports = {
    resError: resError,
    resSuccess: resSuccess,
    home: home,
    webUI: webUI,
    submitWebRequest: submitWebRequest,
    submitAPIRequest: submitAPIRequest
}
