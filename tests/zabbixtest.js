var should = require('should');
require('../config')
var zb = require('../zabbix/login');
;
var zlogin = new zb(2);


describe('Zabbix Module Test suite', function(){

    it("zabbix login function should return results", function(done){
        zlogin.login(ZABBIX.USERNAME, ZABBIX.PASSWORD, function(data, res){
            should.exist(res);
            res.statusCode.should.equal(200);
            should.exist(data);
            should.not.exist(data.error);
            done();
        })
    });

    it("zabbix api method call test failed", function(done){
        zlogin.login(ZABBIX.USERNAME, ZABBIX.PASSWORD, function(data, res){
            var sessID = data.result;
            var zapi = require('../zabbix/api')
            var client = new zapi(sessID);

            client.exec(ZABBIX.METHODS.history, {limit: 2}, function(resData, rawRes){
                should.exist(rawRes);
                rawRes.statusCode.should.equal(200);
                should.exist(resData);
                should.not.exist(resData.error);
                done();
            });
        })
    });

});
