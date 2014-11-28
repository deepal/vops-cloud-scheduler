module.exports = function(resourceRequest){

    var hostStats = [];
    var hosts = [];
    var averages = [];
    require('../../config');

    var configUpdater = new (require("../admin/configUpdater"))();
    var responseInfo = require('../../config/responseMessages');

    var db = require('../../core/db');
    var EwmaSchema = require('../db/schemas/dbItemEWMA');


    var attrContainsInKeys = function(val){
        var keys = ZABBIX.SELECTED_ITEM_ATTR;
        return keys.indexOf(val) > -1;
    }

    var fetchHostItemInfo = function(zSession, callback){

        var getHostItems = function(zapi, hostIndex, hosts, callback){
           console.log("Host index"+ hostIndex);
            if(hostIndex >= hosts.length){
                callback(null, hosts);
            }
            else{
                zapi.exec(ZABBIX.METHODS.itemslist, {hostids: hosts[hostIndex].hostid, output: "extend"}, function(data, rawRes){
                    if(!data.error){
                        for(var j in data.result){
                            if(attrContainsInKeys(data.result[j].key_) == true) {
                                hosts[hostIndex].items.push({
                                    id: data.result[j].itemid,
                                    key: data.result[j].key_,
                                    historyItems: []
                                });
                            }
                        }
                        hostIndex++;
                        getHostItems(zapi, hostIndex, hosts, callback);
                    }
                    else{
                        callback(data.error);
                    }
                });
            }

        }

        var zapi = new (require('../../zabbix/api'))(zSession);     //create a new object of zabbix module
        //call host.get method via zabbix api
        zapi.exec(ZABBIX.METHODS.hostslist, {}, function(data, rawRes){
            if(!data.error){
                for(var i in data.result){
                    var host = data.result[i];
                    hosts.push({
                        hostid: host.hostid,
                        items: []
                    });
                }

                //it is required to call zabbix api request once for each host. Zabbix api provides a way to get
                //all items belongs to multiple hosts at once. But since when we limit response item count, items which
                //belongs to some hosts will be cut off. So, we need to send new request for each host.

                getHostItems(zapi, 0, hosts, function(error, hostObj){
                    callback(null, hostObj);
                });
            }
            else{
                callback(data.error);
            }
        });
    }

    var fetchHostStats = function(zSession, callback){
        fetchHostItemInfo(zSession, function(err, hostInfo){
            var zapi = new (require('../../zabbix/api'))(zSession);
            getItemHistory(zapi, hostInfo, 0, callback);
        });
    }

    var getItemHistory = function(zapi, hostInfo, hostIndex, callback){
        if(hostIndex >= hostInfo.length){
            callback(null, hostInfo);
        }
        else{
            getHistoryPerItem(zapi, hostInfo, hostIndex, 0, function(err, hostInfo){
                if(!err){
                    hostIndex++;
                    getItemHistory(zapi, hostInfo, hostIndex, callback);
                }
                else{
                    callback(err);
                }
            });
        }
    }

    var getHistoryPerItem = function(zapi, hostInfo, hostIndex, itemIndex, callback){
        if(itemIndex >= (hostInfo[hostIndex]).items.length){
            callback(null, hostInfo);
        }
        else{

            var params = {
                output: "extend",
                history: 0,
                itemids: hostInfo[hostIndex].items[itemIndex].id,
                sortfield: "clock",
                sortorder: "DESC",
                limit: 2
            }

            zapi.exec(ZABBIX.METHODS.history, params, function(data, res){

                if(!data.error){

                    for(var i in data.result){
                        hostInfo[hostIndex].items[itemIndex].historyItems.push({
                            item: data.result[i].itemid,
                            timestamp: data.result[i].clock,
                            value: data.result[i].value,
                            ns: data.result[i].ns
                        });
                    }

                    itemIndex++;

                    getHistoryPerItem(zapi, hostInfo, hostIndex, itemIndex, callback);
                }
                else{
                    callback(data.error);
                }

            });
        }
    }

    var calculateMovingAverage = function (zSession, callback) {
        fetchHostStats(zSession, function (error, hostInfo) {
            if (!error) {
                getInfoItem(0, hostInfo, function(error, hostInfo, hostStats){
                    insertItemInfo(0, hostStats, callback);
                });
            }
            else {
                callback(error);
            }
        });
    }

    var getInfoItem = function (hostIndex, hostInfo, callback) {
        if (hostIndex >= hostInfo.length) {
            callback(null, hostInfo, hostStats);
        }

        else {
            getInfoPerItem(hostIndex, 0, hostInfo, function (err, hostInfo) {
                if (!err) {
                    hostIndex++;
                    getInfoItem(hostIndex, hostInfo, callback);
                }

                else {
                    callback(err);
                }
            });
        }
    }

    var getInfoPerItem = function (hostIndex, itemIndex, hostInfo, callback) {
        if (itemIndex >= hostInfo[hostIndex].items.length) {
            callback(null, hostInfo, hostStats);
        }
        else {
            EwmaSchema.findOne({zabbixItemID: hostInfo[hostIndex].items[itemIndex].id}).exec(function (err, item) {
                if (err) {
                    responseInfo.error(500, "Internal Server Error !", err);
                }
                else {
                    configUpdater.readConfig(function (err, config) {
                        if (!err) {
                            if (item) {
                                var average = 0;
                                for (var i = 0; i < hostInfo[hostIndex].items[itemIndex].historyItems.length; i++) {
                                    average = average + parseFloat(hostInfo[hostIndex].items[itemIndex].historyItems[i].value);
                                }

                                ewma_new = (config.hostFilter.alpha) * parseFloat(item.ewma_last) + (1 - (config.hostFilter.alpha)) * average;
                                hostStats.push({
                                    hostId: hostInfo[hostIndex].hostid,
                                    itemId: hostInfo[hostIndex].items[itemIndex].id,
                                    ewma_latest: ewma_new
                                });
                            }
                            else {
                                var average = 0;
                                for (var i = 0; i < hostInfo[hostIndex].items[itemIndex].historyItems.length; i++) {
                                    average = average + parseFloat(hostInfo[hostIndex].items[itemIndex].historyItems[i].value);
                                }
                                hostStats.push({
                                    hostId: hostInfo[hostIndex].hostid,
                                    itemId: hostInfo[hostIndex].items[itemIndex].id,
                                    ewma_latest: average
                                });
                            }
                            itemIndex++;
                            getInfoPerItem(hostIndex, itemIndex, hostInfo, callback);
                        }
                        else {
                            throw err;
                        }
                    });
                }
            });
        }
    }

    var insertItemInfo = function(statItemIndex, hostStats, callback) {

        if (statItemIndex >= hostStats.length) {
            callback(null, hostStats);
        }
        else {
            var conditions = {zabbixItemID: hostStats[statItemIndex].itemId};
            var update = { $set: {ewma_last: hostStats[statItemIndex].ewma_latest}};
            var options = { upsert : true};

            EwmaSchema.update(conditions, update, options, function (err) {
                if (!err) {
                    statItemIndex++;
                    insertItemInfo(statItemIndex, hostStats, callback);
                }
                else {
                    callback(err);
                }
            });
        }
    }


    var fetchCloudInfo = function (zSession, callback){
        calculateMovingAverage(zSession, function(err, hostInfo, hostStats){
            ///filter hosts and pass candidate hosts and there resource utilization info to callback function
           // resourceRequest
            callback(null, hostInfo, hostStats);
        });
    }

    return {
        fetchCloudInfo: fetchCloudInfo
    }

}
