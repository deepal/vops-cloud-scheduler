describe('Authentication Service Test suite', function () {

    var db = require('../core/db');
    var should = require('should');
    var User = require('../core/db/schemas/dbUser');
    var UserSession = require('../core/db/schemas/dbSession');
    require('../config/index');

    beforeEach(function (done) {

        User.find({ username: 'deepal'}).remove(function (err) {
            if(err){
                throw err;
            }
            done();
        });

    });

    afterEach(function (done) {
        UserSession.find({username: 'vishmi'}).remove(function (err) {
            if(err){
                throw err;
            }
            done();
        });
    });

    it('Login function should create a session on database and should return the session key', function(done){
        var authService = new (require('../core/auth/authService'))();

        authService.login('vishmi','vnd', function (err, sessionKey) {
            should.not.exist(err);
            should.exist(sessionKey);
            done();
        });

    });

    it('CreateUser function should create a user and return user ID through callback', function (done) {
        var authService = new (require('../core/auth/authService'))();
        require('../config');
        authService.createUser({
            username: 'deepal',
            password: 'dnv',
            userInfo: {
                firstname: 'Deepal',
                lastname: 'Jayasekara',
                index: '100341V'
            },
            priority: PRIORITY.USER.MEDIUM.value
        }, function (err, result) {
            should.not.exist(err);
            should.exist(result);
            result.status.should.equal('Success');
            done();
        });
    });

});