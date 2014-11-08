require('./config');
var bodyParser = require('body-parser');
var xmlParser = require('express-xml-bodyparser');
var zabbixLogin = new(require("./zabbix/login"))(1);
var sessID = '';
var test = "123";

var pubDir = './core/frontend/public';
var viewDir = './core/frontend/views';

var resError = function(res, msg){
    res.send({
        result: "error",
        message: msg
    });
}

var resSuccess = function(res, msg){
    res.send({
        result: "success",
        message: msg
    });
}


zabbixLogin.login(ZABBIX_USERNAME, ZABBIX_PASSWORD, function(data, res){
    sessID = data.result;

    var cloudstack = new (require('./cloudstack/lib/cloudstack'))({
        apiUri: 'http://localhost:8080/client/api?',
        apiKey: 'yl47bTZM6BxSj80AV9kjPKqccpwe_BhYiHZ1n28rdOe6l3SbjU6A1AWkKAF9rr-G2f4Fw9vP2tTmE4NSqTwshg',
        apiSecret: 'WoXBbFBiXszG-Fc25hkbj1Rx46CZq3TabrSVKYtsYSKzS3c6NhZPZG-sf_U_RxHlMsFYDjZwhO6JPtEpTvH_AQ'
    });

    var zapi = new(require('./zabbix/api'))(sessID);

//    zapi.exec(ZABBIX_API_METHODS.hostslist, null, function(data, res){
//        console.log(data);
//        console.log(res.statusCode);
//    });

    var express = require('express');
    var app = express();

    app.use(express.static(pubDir));
    app.set('views', viewDir);
    app.set('view engine', 'jade');

    app.use(bodyParser.json());
    app.use(xmlParser());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.get('/', function(req, res){
        console.log("Express server got a request");
        resSuccess(res, "Resource scheduler is up and running")
    });

    app.get('/web', function(req, res){
        var requestAttrs = ATTRS;
        res.render('request', {title : 'Submit a resource request', attrs : requestAttrs});
    });

    app.post('/submit', function(req, res){
        console.log("request received");
        res.send("Your request received!");
    });

    app.post('/request/:type', function(req, res){
        res.send(req.body);
    });

    console.log("Resource scheduler is waiting for requests...");
    app.listen(3000);

});



