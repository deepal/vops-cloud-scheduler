var zabbix = function() {
    require("../config");
    this.restclient = require('node-rest-client').Client;
    this.client = new this.restclient();
    this.zabbixapi = ZABBIX_API_METHODS;
    this.endPoint = ZABBIX_API;

    //var protocol = options[port] === '443' ? https : http;

    this.sessionID = null;
    this.reqID = 1;

    this.getSessionID = function(){
        return this.sessionID;
    }

    this.getSampleValue = function(){
        return "123";
    }

    this.login = function(username, password) {

        //if session id already has a value, do not execute login method.
        if(this.sessionID != null){
            return {
                status : false,
                data : "Session ID is null"
            };
        }

        var reqOptions = {};
        var reqParams = {};

        //create the POST request body
        reqOptions.jsonrpc = "2.0";
        reqOptions.method = ZABBIX_API_METHODS.login;
        reqParams.user = username;
        reqParams.password = password;
        reqOptions.params = reqParams;
        reqOptions.id = this.reqID;
        reqOptions.auth = null;

        var args = {
            data: reqOptions,
            headers:{"Content-Type": "application/json-rpc"}    // ask response type to be application/json-rpc
        };

        this.resp = {};

        this.client.post(this.endPoint, args, function(data,res){
            //console.log("hit post method");
            if(res.statusCode == 200){
                this.resp.data = data;
                this.resp.status = true;
                this.sessionID = data.result;
                this.reqID++;
                return this.resp;
            }
            else{
                this.resp.data = "Request failed! Response code: "+resp.statusCode;
                this.resp.status = false;
                this.reqID++;
                return this.resp;
            }
        });
    }

    this.callMethod = function(method, params){

        if(this.sessionID == null){
            return {
                status: false,
                data: "Not logged in!"
            };
        }

        var reqOptions = {};
        reqOptions.jsonrpc = "2.0";
        reqOptions.method = method;
        reqOptions.params = params;
        reqOptions.id = reqID;
        reqOptions.auth = this.getSessionID();

        var args = {
            data : reqOptions,
            headers: {"Content-Type":"application/json-rpc"}
        };

        this.client.post(this.endPoint, args, function(data, res){
            if(data.id == reqID){
                return {
                    status: true,
                    data: data.result
                }
            }
            else{
                return {
                    status: false,
                    data: "Request ID and Response ID does not match!"
                };
            }
        });
    }

    this.functions = {
        login: this.login,
        callMethod: this.callMethod,
        getSampleValue: this.getSampleValue,
        getSessionID: this.getSessionID
    }

    return this.functions;

}

module.exports = function(){
    var zabbixInstance = new zabbix();
    return zabbixInstance;
}