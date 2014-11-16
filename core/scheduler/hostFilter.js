module.exports = function(resourceRequest){

    var hostStats = {};
    var hosts = [];
    require('../../config');

    var getHostItems = function(zapi, hostIndex, hosts, callback){
        console.log("Host index"+ hostIndex);
        if(hostIndex >= hosts.length){
            callback(null, hosts);
        }
        else{
            zapi.exec(ZABBIX.METHODS.itemslist, {hostids: hosts[hostIndex].hostid}, function(data, rawRes){
                if(!data.error){
                    for(var j in data.result){
                        hosts[hostIndex].items.push(data.result[j].itemid);
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

    var fetchHostStats = function(zSession, callback){
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

    return {
        fetchHostStats: fetchHostStats
    }

}
