module.exports = function(){
    var getItemValueByKey = function (hostInfo, key) {
        for (var i in hostInfo.itemInfo) {
            if (hostInfo.itemInfo[i].itemKey == key) {
                return hostInfo.itemInfo[i].value;
            }
        }
        return false;
    };

    var getHostByZabbixId = function (filteredHosts, hostID) {
        for (var i in filteredHosts) {
            if (filteredHosts[i].hostId == hostID) {
                return filteredHosts[i];
            }
        }
        return false;
    };

    var getDBHostByZabbixId = function (zabbixId, callback) {
        var DBHost = require('../db/schemas/dbHost');
        DBHost.findOne({
            zabbixID: zabbixId
        }).exec(function (err, dbHost) {
            if(err){
                callback(response.error(500, "Database Error !", err));
            }
            else{
                callback(null, dbHost);
            }
        });
    };

    return {
        getItemValueByKey: getItemValueByKey,
        getHostByZabbixId: getHostByZabbixId,
        getDBHostByZabbixId: getDBHostByZabbixId
    }
};
