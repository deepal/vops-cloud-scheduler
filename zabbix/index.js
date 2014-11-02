module.export = function(options) {
    require("../config");
    var http = require('http');
    var https = require('https');
    var restclient = require('node-rest-client').Client;
    var client = new restclient();

    var endPoint = ZABBIX_API;

    //var protocol = options[port] === '443' ? https : http;

    var sessionID = null;
    var reqID = 1;

    var login = function(username, password) {

        //if session id already has a value, do not execute login method.
        if(sessionID != null || sessionID != ''){
            return false;
        }

        var reqOptions = {};
        var reqParams = {};

        //create the POST request body
        reqOptions.jsonrpc = "2.0";
        reqOptions.method = "user.login";
        reqParams.user = username;
        reqParams.password = password;
        reqOptions.params = reqParams;
        reqOptions.id = reqID;
        reqOptions.auth = null;

        var args = {
            data: reqOptions,
            headers:{"Content-Type": "application/json-rpc"}    // ask response type to be application/json-rpc
        };

        client.post(endPoint, args, function(data,res) {

            //check response ID matches the request ID
            if(data.id == reqID){
                sessionID = data.result;
            }
        });

        reqID++;

        return true;
    }

}
