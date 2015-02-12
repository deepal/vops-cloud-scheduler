module.exports = function (callback) {
    var db = require('../../core/db');
    var Hosts = require('../../core/db/schemas/dbHost');
    var zlogin = require('../../zabbix/login')(1);
    require('../../config');
    var response = require('../../config/responseMessages');


    var getCloudStackHostIDByIP = function (cloudstackHosts, ip) {
        for(var i=0;i<cloudstackHosts.length;i++){
            if(cloudstackHosts[i].ipaddress == ip){
                return cloudstackHosts[i].id;
            }
        }
        return false;
    };

    //var getZabbixHostIDByIP = function (zabbixHosts, ip) {
    //    for(var i=0;i<zabbixHosts.length;i++){
    //        if(zabbixHosts[i].ip == ip){
    //            return zabbixHosts[i].hostid;
    //        }
    //    }
    //    return false;
    //};

    var addHostToDB = function (index, zabbixHosts, cloudstackHosts, callback) {
        if(index >= zabbixHosts.length){
            callback("Done");
        }
        else{
            var zabbixID = zabbixHosts[index].hostid;
            var ip = zabbixHosts[index].ip;
            var cloudstackID = getCloudStackHostIDByIP(cloudstackHosts,ip);

            if(cloudstackID){
                var newHost = new Hosts({
                    zabbixID: zabbixID,
                    cloudstackID: cloudstackID,
                    ipAddress: ip
                });

                newHost.save(function (err) {
                    if(err){
                        throw err;
                    }
                    else{
                        addHostToDB(index+1, zabbixHosts, cloudstackHosts, callback);
                    }
                });
            }
            else{
                addHostToDB(index+1, zabbixHosts, cloudstackHosts, callback);
            }
        }
    };

    Hosts.find().remove(function (err) {
        if(!err){
            zlogin.login(ZABBIX.USERNAME, ZABBIX.PASSWORD, function (resData, rawRes) {
                var zapi = require('../../zabbix/api')(resData.result);

                var cloudstack = new (require('csclient'))({
                    serverURL: CLOUDSTACK.API,
                    apiKey: CLOUDSTACK.API_KEY,
                    secretKey: CLOUDSTACK.SECRET_KEY
                });

                zapi.exec('hostinterface.get', {}, function (resData, rawData) {
                    var zabbixHostInfo = resData.result;

                    cloudstack.execute('listHosts', {}, function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            var cloudstackHostInfo = result.listhostsresponse.host;
                            addHostToDB(0,zabbixHostInfo,cloudstackHostInfo,function(res){
                                callback(response.success(200, SUCCESS.HOST_REPOPULATED, res));
                            });

                        }
                    });

                });
            });
        }
    });

}(function (res) {
    console.log(res);
});