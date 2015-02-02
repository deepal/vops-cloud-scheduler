require('../config');

var cloudstack = new (require('csclient'))({
    serverURL: CLOUDSTACK.API,
    apiKey: CLOUDSTACK.API_KEY,
    secretKey: CLOUDSTACK.SECRET_KEY
});

var zlogin = require('../../zabbix/login')(1);

zlogin.login(ZABBIX.USERNAME, ZABBIX.PASSWORD, function (data, res) {
    var sessID = data.result;


});


