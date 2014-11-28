var should = new require('should');

var cloudstack = new (require('csclient'))({
    serverURL: 'http://10.8.100.145:8080/client/api?',
    apiKey: 'X3bh4KCyuwTi-dwceXr8XN64sV7Q7qLpOWIrAIRY9YZqCuPmpQvESMyX4pzr73wn68nk06RGzYGJhezKqFu8cg',
    secretKey: '4LbvY2_dAyLXxyolHC3aAxttu4r1jaz8AIa4kkuJ8Z9T5IZRXBbU4UKXDnqNfbPVHUQGbol6UXHTDOc9vpMH6Q'
});

describe.skip('Cloudstack module test suite', function(){

    beforeEach(function(done){
        //nothing yet
        done();
    });

    afterEach(function(done){
        //nothing yet
        done();
    });

    it('Cloudstack call should return response code other than undefined', function(done){

        cloudstack.execute('listUsers', {}, function(err, result){
            console.log(JSON.stringify(result));
            should.exist(result);
            should.not.exist(err);
            done();
        });
    });


});
