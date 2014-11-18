module.exports = function(resourceRequest){

    var hostStats = {};
    var hosts = [];
   // var historyItems = [];
    require('../../config');

    var attrContainsInKeys = function(val){
        var keys = ['vm.memory.size[available]','vfs.fs.size[/,free]','vfs.fs.size[/,pfree]', 'system.cpu.load', '	vfs.fs.size[/,total]', '']
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
                        //new code
                        var itemno =0;
                        for(var j in data.result){
                            hosts[hostIndex].items.push({
                                id: data.result[j].itemid,
                                key: data.result[j].key_,
                                historyItems: []
                            });
                           //new  code

                           itemno++;
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
        })
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
                limit: 1
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

    return {
        fetchHostItemInfo: fetchHostItemInfo
    }

}
