describe('Admin validator test suite', function () {

    var db = require('../core/db');
    var UserSession = require('../core/db/schemas/dbSession');
    var authService = require('../core/auth/authService')();
    var should = require('should');

    afterEach(function (done) {
        UserSession.find({ username: 'admin' }).remove(function (err) {
            if(err){
                throw err;
            }
            done();
        });
    });

    it('Validator should return true through callback for a valid admin session', function (done) {
        var validator = require('../core/admin/adminValidator')();

        authService.login('admin','password', function (err, sessionID) {
            if(err){
                throw err;
            }
            else{
                validator.validateAdmin(sessionID, function(err, result){
                    should.not.exist(err);
                    should.exist(result);
                    should.exist(result.admin);
                    result.admin.should.equal(true);
                    console.log(result);
                    done();
                });
            }
        });
    });

});