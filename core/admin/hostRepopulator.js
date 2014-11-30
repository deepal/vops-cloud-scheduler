var repopulateHosts = function (zabbixSession, callback) {
    var zapi = require('../../zabbix/api')(zabbixSession);
    require('../../config');
    require('../../cloudstack');
    var response = require('../../config/responseMessages');

    zapi.exec(ZABBIX.METHODS.hostslist, {}, function (resData, rawRes) {
        //TODO: need to handle network errors as well using 'rawRes' object
        if(resData.error){
            callback(response.error(500, 'Zabbix Error!', resData.error));
        }
        else{
            var zabbixHostCount = resData.result.length;

            if(zabbixHostCount){
                callback(response.error(200, 'No hosts configured in Zabbix. Please recheck.'));
            }

            //TODO: ask cloudstack for host info and compare whether all hosts in zabbix exists in cloudstack configuration
        }
    });
}