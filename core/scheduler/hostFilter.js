module.exports = function (resourceRequest) {

    require('../../config');

    var cloudstack = new (require('csclient'))({
        serverURL: CLOUDSTACK.API,
        apiKey: CLOUDSTACK.API_KEY,
        secretKey: CLOUDSTACK.SECRET_KEY
    });

    var hostStats = [];
    var hosts = [];
    require('../../config');

    var configUpdater = new (require("../admin/configUpdater"))();
    var responseInfo = require('../../config/responseMessages');

    var db = require('../../core/db');
    var EwmaSchema = require('../db/schemas/dbItemEWMA');
    var stats = require('stats-lite');

    var _ = require('underscore');


    var attrContainsInKeys = function (val) {
        var keys = ZABBIX.SELECTED_ITEM_ATTR;
        return keys.indexOf(val) > -1;
    };

    var getHostItems = function (zapi, hostIndex, hosts, callback) {
        if (hostIndex >= hosts.length) {
            callback(null, hosts);
        }
        else {
            zapi.exec(ZABBIX.METHODS.itemslist, {
                hostids: hosts[hostIndex].hostid,
                output: "extend"
            }, function (data, rawRes) {
                if (!data.error) {
                    for (var j =0; j< data.result.length; j++) {

                        if (attrContainsInKeys(data.result[j].key_) == true) {
                            hosts[hostIndex].items.push({
                                id: data.result[j].itemid,
                                key: data.result[j].key_,
                                valueType: parseInt(data.result[j].value_type),
                                historyItems: []
                            });
                        }
                    }
                    hostIndex++;
                    getHostItems(zapi, hostIndex, hosts, callback);
                }
                else {
                    callback(data.error);
                }
            });
        }
    };

    var fetchHostItemInfo = function (zSession, callback) {

        var zapi = new (require('../../zabbix/api'))(zSession);     //create a new object of zabbix module
        //call host.get method via zabbix api
        zapi.exec(ZABBIX.METHODS.hostslist, {}, function (data, rawRes) {
            if (!data.error) {
                for (var i =0; i<data.result.length; i++) {
                    var host = data.result[i];
                    hosts.push({
                        hostid: host.hostid,
                        items: []
                    });
                }

                //it is required to call zabbix api request once for each host. Zabbix api provides a way to get
                //all items belongs to multiple hosts at once. But since when we limit response item count, items which
                //belongs to some hosts will be cut off. So, we need to send new request for each host.

                getHostItems(zapi, 0, hosts, function (error, hostObj) {
                    callback(null, hostObj);
                });
            }
            else {
                callback(data.error);
            }
        });
    }

    var fetchHostStats = function (zSession, callback) {
        fetchHostItemInfo(zSession, function (err, hostInfo) {
            if (err) {
                callback(err);
            }
            else {
                var zapi = new (require('../../zabbix/api'))(zSession);
                getItemHistory(zapi, hostInfo, 0, callback);
            }
        });
    }

    var getItemHistory = function (zapi, hostInfo, hostIndex, callback) {
        if (hostIndex >= hostInfo.length) {
            callback(null, hostInfo);
        }
        else {
            getHistoryPerItem(zapi, hostInfo, hostIndex, 0, function (err, hostInfo) {
                if (!err) {
                    hostIndex++;
                    getItemHistory(zapi, hostInfo, hostIndex, callback);
                }
                else {
                    callback(err);
                }
            });
        }
    }

    var getHistoryPerItem = function (zapi, hostInfo, hostIndex, itemIndex, callback) {
        if (itemIndex >= (hostInfo[hostIndex]).items.length) {
            callback(null, hostInfo);
        }
        else {

            var params = {
                output: "extend",
                history: hostInfo[hostIndex].items[itemIndex].valueType,
                itemids: hostInfo[hostIndex].items[itemIndex].id,
                sortfield: "clock",
                sortorder: "DESC",
                limit: 2
            }

            zapi.exec(ZABBIX.METHODS.history, params, function (data, res) {

                if (!data.error) {

                    for (var i=0; i< data.result.length; i++) {
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
                else {
                    callback(data.error);
                }

            });
        }
    }

    var calculateMovingAverage = function (zSession, callback) {
        fetchHostStats(zSession, function (error, hostInfo) {
            if (!error) {
                configUpdater.readConfig(function(err, config){
                    if(!err){
                        getStatInfoItem(0, hostInfo,config, function (error, hostInfo, hostStats) {
                            updateDBInfo(0, hostStats, callback);
                        });
                    }
                    else{
                        callback(err);
                    }
                });
            }
            else {
                callback(error);
            }
        });
    };

    var getStatInfoItem = function (hostIndex, hostInfo, config,  callback) {
        if (hostIndex >= hostInfo.length) {
            callback(null, hostInfo, hostStats);
        }

        else {
            hostStats.push({
                hostId: hostInfo[hostIndex].hostid,
                itemInfo: []
            });
            getStatInfoPerItem(hostIndex, 0, hostInfo, hostStats, config, function (err, hostInfo) {
                if (!err) {
                    hostIndex++;
                    getStatInfoItem(hostIndex, hostInfo, config, callback);
                }

                else {
                    callback(err);
                }
            });
        }
    };

    var getStatInfoPerItem = function (hostIndex, itemIndex, hostInfo, hostStats, config, callback) {
        if (itemIndex >= hostInfo[hostIndex].items.length) {
            callback(null, hostInfo, hostStats);
        }
        else {
            EwmaSchema.findOne({zabbixItemID: hostInfo[hostIndex].items[itemIndex].id}).exec(function (err, item) {
                if (err) {
                    responseInfo.error(500, "Internal Server Error !", err);
                }
                else {
                    if (item) {
                        var average;
                        var values = [];
                        if (hostInfo[hostIndex].items[itemIndex].historyItems.length) {
                            for (var i = 0; i < hostInfo[hostIndex].items[itemIndex].historyItems.length; i++) {
                                values[i] = parseFloat(hostInfo[hostIndex].items[itemIndex].historyItems[i].value);
                            }
                            average = stats.mean(values);
                        }
                        else {
                            average = 0;
                        }
                        if (hostInfo[hostIndex].items[itemIndex].valueType == 0) {
                            var ewma_new = (config.hostFilter.alpha) * parseFloat(item.ewma_last) + (1 - (config.hostFilter.alpha)) * average;
                        }
                        else {
                            var ewma_new = average;
                        }
                        hostStats[hostIndex].itemInfo.push({
                            itemId: hostInfo[hostIndex].items[itemIndex].id,
                            itemKey: hostInfo[hostIndex].items[itemIndex].key,
                            value: ewma_new
                        });
                    }
                    else {
                        var average;
                        var values = [];
                        if (hostInfo[hostIndex].items[itemIndex].historyItems.length) {
                            for (var i = 0; i < hostInfo[hostIndex].items[itemIndex].historyItems.length; i++) {
                                values[i] = parseFloat(hostInfo[hostIndex].items[itemIndex].historyItems[i].value);
                            }
                            average = stats.mean(values);
                        }
                        else {
                            average = 0;
                        }
                        hostStats[hostIndex].itemInfo.push({
                            itemId: hostInfo[hostIndex].items[itemIndex].id,
                            itemKey: hostInfo[hostIndex].items[itemIndex].key,
                            value: average
                        });
                    }
                    itemIndex++;
                    getStatInfoPerItem(hostIndex, itemIndex, hostInfo, hostStats, config, callback);
            }
            });
        }
    };

    var updateDBInfo = function (statHostIndex, hostStats, callback) {
        if (statHostIndex >= hostStats.length) {
            callback(null, hostStats);
        }
        else {
            updateDBInfoPerItem(statHostIndex, 0, hostStats, function (err, hostStats) {
                if (err) {
                    callback(err);
                }
                else {
                    statHostIndex++;
                    updateDBInfo(statHostIndex, hostStats, callback);
                }
            });
        }
    };

    var updateDBInfoPerItem = function (statHostIndex, statItemIndex, hostStats, callback) {
        if (statItemIndex >= hostStats[statHostIndex].itemInfo.length) {
            callback(null, hostStats);
        }
        else {
            var conditions = {zabbixItemID: hostStats[statHostIndex].itemInfo[statItemIndex].itemId};
            var update = {$set: {ewma_last: hostStats[statHostIndex].itemInfo[statItemIndex].value}};
            var options = {upsert: true};

            EwmaSchema.update(conditions, update, options, function (err) {
                if (!err) {
                    statItemIndex++;
                    updateDBInfoPerItem(statHostIndex, statItemIndex, hostStats, callback);
                }
                else {
                    callback(err);
                }
            });
        }
    };

    var fetchPossibleHosts = function (resourceRequest, hostStats, callback) {

        var attrInKeys = function (attr, hostInfo) {
            for(var k=0; k< hostInfo.itemInfo.length; k++){
                if(hostInfo.itemInfo[k].itemKey == attr){
                    return true;
                }
            }
            return false;
        };
        
        var candidateHosts = _.clone(hostStats);

        for (var i = 0; i < candidateHosts.length; i++) {
            for (var j = 0; j < ZABBIX.SELECTED_ITEM_ATTR.length; j++) {
                if(!attrInKeys(ZABBIX.SELECTED_ITEM_ATTR[j], candidateHosts[i])){
                    candidateHosts.splice(i,1);
                    i= i-1;
                    break;
                }
            }
        }

        var getValueForCSConfigKey = function (listconfigurationsresponse, key) {
            var config = listconfigurationsresponse.configuration;
            for(var i =0;  i< config.length; i++){
                if(config[i].name == key){
                    return config[i].value;
                }
            }
            return 1;
        };

        cloudstack.execute('listConfigurations', {}, function(err, result){
            if(err){
                var cloudstackCpuOPFactor = 1;
                var cloudstackMemOPFactor = 1;
                var cloudstackStorageOPFactor = 1;
            }
            else{
                var cloudstackCpuOPFactor = getValueForCSConfigKey(result.listconfigurationsresponse, 'cpu.overprovisioning.factor');
                var cloudstackMemOPFactor = getValueForCSConfigKey(result.listconfigurationsresponse, 'mem.overprovisioning.factor');
                var cloudstackStorageOPFactor = getValueForCSConfigKey(result.listconfigurationsresponse, 'storage.overprovisioning.factor');
            }

            resourceRequest = resourceRequest.group[0];

            for (var i = 0; i < candidateHosts.length; i++) {
                for (var j = 0; j < candidateHosts[i].itemInfo.length; j++) {
                    if (candidateHosts[i].itemInfo[j].itemKey == 'vm.memory.size[available]') {
                        var requestingMemory = parseInt(resourceRequest.min_memory[0].size[0]);
                        switch ((resourceRequest.min_memory[0].unit[0]).toLowerCase()){
                            case 'b':
                                break;
                            case 'kb':
                                requestingMemory = requestingMemory * 1024;
                                break;
                            case 'mb':
                                requestingMemory = requestingMemory * 1024 * 1024;
                                break;
                            case 'gb':
                                requestingMemory = requestingMemory * 1024 * 1024 * 1024;
                                break;
                            case 'tb':
                                requestingMemory = requestingMemory * 1024 * 1024 * 1024 * 2014;
                                break;
                            default :
                                callback(responseInfo.error(403, "Unsupported unit for min_memory in resource request!"));
                        }

                        if (requestingMemory > candidateHosts[i].itemInfo[j].value * cloudstackMemOPFactor) {
                            candidateHosts.splice(i,1);
                            i = i-1;
                            break;
                        }
                    }
                }
            }
            //console.log("memoryCandidateHosts:"+JSON.stringify(candidateHosts));

            //Filtering Hosts with sufficient cores from those who already fulfill memory requirements
            for (var i = 0; i < candidateHosts.length; i++) {
                for (var j = 0; j < candidateHosts[i].itemInfo.length; j++) {
                    if (candidateHosts[i].itemInfo[j].itemKey == 'system.cpu.num') {
                        if ((parseInt(resourceRequest.cpu[0].cores[0])) > candidateHosts[i].itemInfo[j].value) {
                            candidateHosts.splice(i,1);
                            i = i-1;
                            break;
                        }
                    }
                }
            }

            //Filtering Hosts who have less than 70% CPU load from proposed candidate Hosts
            for (var i = 0; i < candidateHosts.length; i++) {
                for (var j = 0; j < candidateHosts[i].itemInfo.length; j++) {
                    if (candidateHosts[i].itemInfo[j].itemKey == 'system.cpu.util') {
                        if (candidateHosts[i].itemInfo[j].value * cloudstackCpuOPFactor > 70) {
                            candidateHosts.splice(i,1);
                            i = i-1;
                            break;
                        }
                    }
                }
            }

            //Filtering Hosts who have required CPU frequency
            for (var i = 0; i < candidateHosts.length; i++) {
                for (var j = 0; j < candidateHosts[i].itemInfo.length; j++) {
                    if (candidateHosts[i].itemInfo[j].itemKey == 'system.hw.cpu') {
                        var requestingFrequency = resourceRequest.cpu[0].frequency[0];
                        switch((resourceRequest.cpu[0].unit[0]).toLowerCase()){
                            case 'hz':
                                break;
                            case 'khz':
                                requestingFrequency = requestingFrequency * 1000;
                                break;
                            case 'mhz':
                                requestingFrequency = requestingFrequency * 1000 * 1000;
                                break;
                            case 'ghz':
                                requestingFrequency = requestingFrequency * 1000 * 1000 * 1000;
                                break;
                            default :
                                callback(responseInfo.error(403, "Unsupported unit for CPU frequency in resource request!"));
                        }
                        if (requestingFrequency > candidateHosts[i].itemInfo[j].value) {
                            candidateHosts.splice(i,1);
                            i = i-1;
                            break;
                        }
                    }
                }
            }

            var possibleMemoryHosts = [];

            for (var i = 0; i < hostStats.length; i++) {
                for (var j = 0; j < hostStats[i].itemInfo.length; j++) {
                    if (hostStats[i].itemInfo[j].itemKey == 'vm.memory.size[total]') {
                        var requestingMemory = parseInt(resourceRequest.min_memory[0].size[0]);
                        switch ((resourceRequest.min_memory[0].unit[0]).toLowerCase()){
                            case 'b':
                                break;
                            case 'kb':
                                requestingMemory = requestingMemory * 1024;
                                break;
                            case 'mb':
                                requestingMemory = requestingMemory * 1024 * 1024;
                                break;
                            case 'gb':
                                requestingMemory = requestingMemory * 1024 * 1024 * 1024;
                                break;
                            case 'tb':
                                requestingMemory = requestingMemory * 1024 * 1024 * 1024 * 2014;
                                break;
                            default :
                                callback(responseInfo.error(403, "Unsupported unit for min_memory in resource request!"));
                        }

                        if (requestingMemory < hostStats[i].itemInfo[j].value * cloudstackMemOPFactor) {
                            possibleMemoryHosts.push(hostStats[i]);
                        }
                    }
                }
            }

            //console.log("possibleMemoryHosts"+ JSON.stringify(possibleMemoryHosts));
            //console.log("candidate Hosts:"+ JSON.stringify(candidateHosts));
            callback(null, candidateHosts, possibleMemoryHosts);
        });
    };

    var fetchCloudInfo = function (zSession, callback) {
        calculateMovingAverage(zSession, function (err, hostStats) {
            ///filter hosts and pass candidate hosts and there resource utilization info to callback function
            // resourceRequest
            if (err) {
                callback(err);
            }
            else {
                fetchPossibleHosts(resourceRequest, hostStats, function (err, filteredCandidateHosts, possibleMemoryHosts) {
                    callback(null,filteredCandidateHosts, possibleMemoryHosts);
                });
            }
        });
    };

    return {
        fetchCloudInfo: fetchCloudInfo
    }
};


