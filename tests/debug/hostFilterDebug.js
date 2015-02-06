var hf = require('../../core/scheduler/hostFilter');
require('../../config');
var filter = new hf(null);

var zl = new (require('../../zabbix/login'))(1);

zl.login(ZABBIX.USERNAME,ZABBIX.PASSWORD,function(data,raw){
    var sessID = data.result;
    filter.fetchCloudInfo(sessID,function(err, filteredInfo, allHostInfo){
//        console.log(JSON.stringify(stats));
        console.log(JSON.stringify(filteredInfo));
        console.log(JSON.stringify(filteredInfo));
    });
});

