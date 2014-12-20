var hostFilter = new (require('../core/scheduler/hostFilter'))(null);
require("../config")
var should = require('should');

describe.skip("Host filter test suite", function(){

    it("hostFilter fetchHostItemInfo() function should return host info object", function(done){
        var zlogin = new (require('../zabbix/login'))(1);
        zlogin.login(ZABBIX.USERNAME, ZABBIX.PASSWORD, function(data, rawRes){
            sessID = data.result;
            hostFilter.fetchCloudInfo(sessID, function(err, hostStats){
                should.not.exist(err);
                should.exist(hostStats);
                console.log(JSON.stringify(hostStats));
                done();
            })
        });
    });

    it.skip("hostFilter fetchHostStats function should return items and their EWMA values", function(done){
        done();
    })
});

