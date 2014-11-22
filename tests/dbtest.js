
describe('MongoDB test suite', function(){

    var db = require('../core/db');
    var UserSchema = require('../core/db/schemas/dbUser');
    var should = require('should')
    require('../config/index')

    beforeEach(function(done){
        UserSchema.find({username: 'dpjayasekara'}).remove(function (err) {
            should.not.exist(err);
            done();
        });
    });

    it('Saved object should be returned as is', function(done){

        var user = new UserSchema({
            username: 'dpjayasekara',
            password: '123',
            userInfo: {
                firstname: 'Deepal',
                lastname: 'Jayasekara',
                index: '100216T'
            },
            priority: PRIORITY.USER.HIGH.value,
            admin: true
        });

        user.save(function (err) {
            should.not.exist(err);
            UserSchema.findOne({username: 'dpjayasekara'}).setOptions({ sort: 'username'})
                .exec(function(err, users){
                    users.userInfo.firstname.should.equal('Deepal');
                    users.userInfo.lastname.should.equal('Jayasekara');
                    users.priority.should.equal(PRIORITY.USER.HIGH.value);
                    done();
                });
        });

    });

});
