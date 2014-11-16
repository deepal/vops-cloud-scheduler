var hostFilter = new (require('../core/scheduler/hostFilter'))(null);
require("../config")
var should = require('should');

//var zlogin = new (require('../zabbix/login'))(1);
//zlogin.login(ZABBIX.USERNAME, ZABBIX.PASSWORD, function(data, rawRes){
//    sessID = data.result;
//    hostFilter.fetchHostStats(sessID, function(err, hostStats){
//        console.log(hostStats);
//    })
//});


describe("Host filter test suite", function(){

    it("hostFilter didn't returned host stats object", function(done){
        var zlogin = new (require('../zabbix/login'))(1);
        zlogin.login(ZABBIX.USERNAME, ZABBIX.PASSWORD, function(data, rawRes){
            sessID = data.result;
            hostFilter.fetchHostStats(sessID, function(err, hostStats){
                should.not.exist(err);
                should.exist(hostStats);
                console.log(hostStats);
                done();
            })
        });
    });
});

