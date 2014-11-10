require('./config');
var bodyParser = require('body-parser');
var xmlParser = require('express-xml-bodyparser');
var zabbixLogin = new(require("./zabbix/login"))(1);

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

var zabbixLoginCallback = function(data, res) {
    sessID = data.result;

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

    app.get('/', function (req, res) {
        console.log("Express server got a request");
        resSuccess(res, "Resource scheduler is up and running")
    });

    app.get('/web', function (req, res) {
        var requestAttrs = ATTRS;
        res.render('request', {title: 'Submit a resource request', attrs: requestAttrs});
    });

    app.post('/submit', function (req, res) {
        console.log("request received");
        res.send("Your request received!");
    });

    app.post('/request', function (req, res) {
        var scheduler = require('./core/scheduler')(req.body);
        res.send(req.body);
    });

    console.log("Resource scheduler is waiting for requests...");
    app.listen(3000);

}

zabbixLogin.login(ZABBIX_USERNAME, ZABBIX_PASSWORD, zabbixLoginCallback);



