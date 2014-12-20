var should = require('should');
var configUpdater = require('../core/admin/configUpdater')();

describe.skip('Config updater test', function () {

    var authService = require('../core/auth/authService')();

    afterEach(function(done){
        configUpdater.readConfig(function(err, config){
            config.hostFilter.alpha = 0.5;
            authService.login('admin', 'password', function (err, sessID) {
                configUpdater.writeConfig(sessID, config, function(err, msg){ //for this moment let's pass adminSessID as null
                    if(err){
                        throw err;
                    }
                    else{
                        done();
                    }

                });
            });
        })
    });

    it('Config updater should read an existing value successfully', function (done) {
        configUpdater.readConfig(function(err, config){
            should.not.exist(err);
            should.exist(config);
            config.hostFilter.alpha.should.equal(0.5);
            done();
        });
    });

    it('Config updater should write a given key successfully', function(done){

        configUpdater.readConfig(function(err, config){
            config.hostFilter.alpha = 0.9;
            authService.login('admin','password', function (err, sessID) {
                configUpdater.writeConfig(sessID, config, function(err, msg){ //for this moment let's pass adminSessID as null
                    should.not.exist(err);
                    should.exist(msg);
                    console.log(msg);
                    configUpdater.readConfig(function(err, config){ //for this moment let's pass adminSessID as null
                        should.not.exist(err);
                        should.exist(msg);
                        config.hostFilter.alpha.should.equal(0.9);
                        done();
                    });

                });
            });
        });

    });
});
