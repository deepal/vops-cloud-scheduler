var zlogin = require('../../zabbix/login')(1);
require('../../config');

zlogin.login(ZABBIX.USERNAME, ZABBIX.PASSWORD, function (resData, rawRes) {
    var zapi = require('../../zabbix/api')(resData.result);

    zapi.exec('hostinterface.get', {}, function (resData, rawData) {
        console.log(resData.result);
    });
});
