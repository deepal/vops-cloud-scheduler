module.exports = function(sessionID){

    require("../config");
    var sessID = sessionID;
    var restClient = require('node-rest-client').Client;
    var client = new restClient();
    var reqID = 1;

    var callMethod = function(methodName, params, callBack){
        var requestParams = {};
        requestParams.jsonrpc = "2.0";
        requestParams.params = params;
        requestParams.auth = sessID;
        requestParams.id = reqID;
        requestParams.method = methodName;

        var args = {
            data: requestParams,
            headers:{"Content-Type": "application/json-rpc"}    // ask response type to be application/json-rpc
        };

        var returnData = {};
        returnData.status = null;
        returnData.data = null

        client.post(ZABBIX_API, args, function(resData,rawRes){
            if(rawRes.statusCode == 200){
                callBack(rawRes.statusCode, resData);
            }
            else{
                callBack(rawRes.statusCode, resData)
            }
        });

    }

    return {
        callMethod: callMethod
    };
}
