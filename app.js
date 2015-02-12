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

    app.use(express.static(__dirname + '/core/frontend/public/css'));
    app.use(express.static(__dirname+'/views'));
    app.get('/', routes.home);

    app.get('/web', function (req, res) {
            res.render('index',
            { title : 'Home' }
                    );
                });

    app.post('/submit', routes.submitWebRequest);

    app.post('/admin/createUser', routes.adminCreateUser);

    app.post('/login', routes.login);

    app.post('/request', function(req, res){
        routes.submitAPIRequest(req, res, sessID);
    });

    app.get('/configuration', routes.configRead); //TODO: Implement routes.configRead

    app.post('/configuration', routes.configWrite); //TODO: Implement routes.configWrite

    app.post('/debug/storage', routes.storageDebug);

    if(sessID){
        app.listen(LISTEN_PORT);
        console.log("Resource scheduler is listening on port "+LISTEN_PORT+"...");
    }
    else{
        console.log("Zabbix Server login error! Check Zabbix connection and credentials.");
    }

};

zabbixLogin.login(ZABBIX.USERNAME, ZABBIX.PASSWORD, zabbixLoginCallback);



