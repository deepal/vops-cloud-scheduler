module.exports = function(sessionID){

    require("../../config/index");
    var bunyan = require('bunyan');
    var logger = bunyan.createLogger({name: APP_NAME});
    var sessID = sessionID;
    var restClient = require('node-rest-client').Client;
    var client = new restClient();
    var reqID = 1;

    var exec = function(methodName, params, callBack){
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
        returnData.data = null;

        var req = client.post(ZABBIX.API, args, function(resData,rawRes){
            callBack(resData, rawRes);
        });

        req.on('error',function(err){
            logger.error(ERROR.REST_CLIENT_ERROR+". Error:"+JSON.stringify(err));
        });

    }

    return {
        exec: exec
    };
}
