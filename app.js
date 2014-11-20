require('./config');
var bodyParser = require('body-parser');
var xmlParser = require('express-xml-bodyparser');
var zabbixLogin = new(require("./zabbix/login"))(1);
var routes = require('./core/frontend/routes/routefunctions');  //this module includes all the functions which gets executed in http request

var pubDir = './core/frontend/public';
var viewDir = './core/frontend/views';

var zabbixLoginCallback = function(data, res) {
    sessID = data.result;

    var db = require('./core/db');
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

    app.get('/', routes.home);

    app.get('/web', routes.webUI);

    app.post('/submit', routes.submitWebRequest);

    app.post('/request', function(req, res){
        routes.submitAPIRequest(req, res, sessID);
    });

    console.log("Resource scheduler is waiting for requests...");
    app.listen(3000);

}

zabbixLogin.login(ZABBIX.USERNAME, ZABBIX.PASSWORD, zabbixLoginCallback);



