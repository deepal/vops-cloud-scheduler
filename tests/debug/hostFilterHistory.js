var hf = require('../../core/scheduler/hostFilter');
require('../../config');
var filter = new hf(null);

var zl = new (require('../../zabbix/login'))(1);

zl.login(ZABBIX.USERNAME,ZABBIX.PASSWORD,function(data,raw){
    var sessID = data.result;
    filter.getItemHistory(sessID, filter.hosts, function(error,hostStats){
        console.log(hostStats);
    });
});
