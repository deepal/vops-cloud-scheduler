var db = require('../../core/db');
var Hosts = require('../../core/db/schemas/dbHost');
var zlogin = require('../../zabbix/login')(1);
require('../../config');

var newHostsArray = [];

Hosts.find().remove(function (err) {
    if(!err){
        zlogin.login(ZABBIX.USERNAME, ZABBIX.PASSWORD, function (resData, rawRes) {
            var zapi = require('../../zabbix/api')(resData.result);

            zapi.exec(ZABBIX.METHODS.hostslist, {}, function (resData, rawData) {
                for(var i in resData.result){
                    var newHost = new Hosts({
                        zabbixID: resData.result[i].hostid,
                        cloudstackID: Math.floor((Math.random() * 100) + 1),
                        ipAddress: '10.8.106.' + Math.floor((Math.random() * 253) + 1)
                    });
                    newHostsArray.push(newHost);
                }
                addHostsToDB(newHostsArray, 0, function (err, result) {
                    console.log(result);
                });
            });
        });
    }
});

var addHostsToDB = function (hosts, index, callback) {
    if(index >= hosts.length){
        callback(null, "Done");
    }
    else{
        hosts[index].save(function (err) {
            if(!err){
                addHostsToDB(hosts, index+1, callback);
            }
            else{
                throw err;
            }
        });
    }
}


