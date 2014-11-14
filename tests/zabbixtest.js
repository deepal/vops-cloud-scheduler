var should = require('should'),
    assert = require('assert');
require('../config')
var zb = require('../zabbix');
var zabbix = zb();


//describe('Zabbix Module Test suite', function(){
//
//    it("zabbix login function should return true", function(done){
//        var res = zabbix.login("Admin", "zabbix");
//        console.log("Data from login method: "+res)
//        assert.equal(true, res.status);
//        done();
//    });
//
//    it("zabbix login function should set the sessionID properly", function(done){
//        assert.notEqual(null, zabbix.getSessionID());
//        done();
//    });
//
//    it("zabbix callMethod function should not give error for valid zabbix call", function(done){
//        var results = zabbix.callMethod(ZABBIX_API_METHODS.hostslist, { "output": "extend" });
//        assert.equal(undefined, results.error);
//        console.log(results);
//        done();
//    });
//
//});
