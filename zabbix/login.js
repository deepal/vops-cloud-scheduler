module.exports = function(requestID){

    require("../config");
    var restClient = require('node-rest-client').Client;
    var client = new restClient();
    var reqID = requestID;

    var login = function(username, password, loginCallback){
        var requestParams = {};
        var apiParams = {};

        requestParams.jsonrpc = "2.0";
        requestParams.method = ZABBIX_API_METHODS.login;
        apiParams.user = username;
        apiParams.password = password;
        requestParams.params = apiParams;
        requestParams.id = reqID;
        requestParams.auth = null;

        var args = {
            data: requestParams,
            headers:{"Content-Type": "application/json-rpc"}    // ask response type to be application/json-rpc
        };

        var returnData = {};
        returnData.status = null;
        returnData.data = null;

        client.post(ZABBIX_API, args, function(resData,rawRes){

            if(rawRes.statusCode == 200){
                loginCallback(rawRes.statusCode, resData )
            }
            else{
                loginCallback(rawRes.statusCode, "Request Failed !" );
            }

        });

    }

    return {
        login: login
    };
}
