var jf = require('jsonfile');
var file = process.env.PWD + '/config/globalConfig.json';

var should = require('should');

describe.skip('JsonFile Config updater module test', function () {

    beforeEach(function(done){
        jf.readFile(file, function (err, obj) {
            obj.hostFilter.alpha = 0.7;

            jf.writeFile(file, obj, function (err) {
                if(err){
                    throw err;
                }
                done();
            })
        })
    });

    it('Key value retrieval should return the value', function (done) {

        jf.readFile(file, function (err, obj) {
            if(err){
                throw err;
            }
            should.not.exist(err);
            should.exist(obj);
            obj.hostFilter.alpha.should.equal(0.7);
            obj.hostFilter.alpha = 0.5;

            jf.writeFile(file, obj, function (err) {
                should.not.exist(err);

                jf.readFile(file, function(err, obj){
                    should.not.exist(err);
                    should.exist(obj);
                    obj.hostFilter.alpha.should.equal(0.5);
                    done();
                });
            });
        })
    });

});
