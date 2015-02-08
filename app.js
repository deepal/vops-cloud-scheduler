require('./config');
var bodyParser = require('body-parser');
var xmlParser = require('express-xml-bodyparser');
var zabbixLogin = new(require("./zabbix/login"))(1);
var routes = require('./core/frontend/routes/routefunctions');  //this module includes all the functions which gets executed in http request

var pubDir = './core/frontend/public';
var viewDir = './core/frontend/views';

var zabbixLoginCallback = function(data, res) {
    var sessID = data.result;

    var db = require('./core/db');
    var express = require('express');
    var app = express();

    /*
    app.use(express.static(pubDir));
    app.set('views', viewDir);
    app.set('view engine', 'jade');
    */
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    
    app.use(bodyParser.json());
    app.use(xmlParser());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(express.static(__dirname + '/core/public/css'));
    app.get('/', function (req, res) {
    res.render('index',
    { title : 'Home' }
        );
    });

    //app.get('/', routes.home);

    app.get('/web', routes.webUI);

    app.post('/submit', routes.submitWebRequest);

    app.post('/admin/createUser', routes.adminCreateUser);

    app.post('/login', routes.login);

    app.post('/request', function(req, res){
        routes.submitAPIRequest(req, res, sessID);
    });

    app.get('/configuration', routes.configRead);

    app.post('/configuration', routes.configWrite);

    app.post('/debug/storage', routes.storageDebug);

    console.log("Resource scheduler is waiting for requests...");

    if(sessID){
        app.listen(3000);
    }
    else{
        console.log("Zabbix Server login error! Check Zabbix connection and credentials.");
    }

}

zabbixLogin.login(ZABBIX.USERNAME, ZABBIX.PASSWORD, zabbixLoginCallback);



