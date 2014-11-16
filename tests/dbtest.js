
describe.skip('MongoDB test suite', function(){

    var db = require('../core/db');
    var userSchema = require('../core/db/schemas/user');
    var should = require('should')


//    beforeEach(function(done){
//        var record = new userSchema({
//            username: "deepal",
//            password: "123",
//            priority: 3
//        });
//
//        record.save(function(err){
//            throw err;
//            done();
//        });
//    });
//
//    afterEach(function(done){
//        userSchema.find().remove(function(err){
//            if(err){
//                throw(err);
//            }
//            done();
//        })
//    });

    it('Saved object should be returned as is', function(done){
        userSchema.findOne({username: 'deepal'}).setOptions({ sort: 'username'})
            .exec(function(err, users){
                users.username.should.equal('deepal');
                users.password.should.equal('123');
                users.priority.should.equal(3);
                done();
            });
    });

});
