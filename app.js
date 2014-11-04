require('./config');
var zabbixLogin = new(require("./zabbix/login"))(1);
var sessID = '';
var test = "123";
zabbixLogin.login(ZABBIX_USERNAME, ZABBIX_PASSWORD, function(data, res){
    sessID = data.result;

    var cloudstack = new (require('./cloudstack/lib/cloudstack'))({
        apiUri: 'http://localhost:8080/client/api?',
        apiKey: 'yl47bTZM6BxSj80AV9kjPKqccpwe_BhYiHZ1n28rdOe6l3SbjU6A1AWkKAF9rr-G2f4Fw9vP2tTmE4NSqTwshg',
        apiSecret: 'WoXBbFBiXszG-Fc25hkbj1Rx46CZq3TabrSVKYtsYSKzS3c6NhZPZG-sf_U_RxHlMsFYDjZwhO6JPtEpTvH_AQ'
    });

    var zapi = new(require('./zabbix/api'))(sessID);

    zapi.exec(ZABBIX_API_METHODS.hostslist, null, function(data, res){
        console.log(data);
        console.log(res.statusCode);
    });


});



