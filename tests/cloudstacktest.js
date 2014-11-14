var should = new require('should');

var cloudstack = new (require('csclient'))({
    serverURL: 'http://localhost:8080/client/api?',
    apiKey: 'tNuyVh4Kt1U2_6dJ9uyTvDy1G-MNZNRVq_OhIoFYARvzxI18hZnwrXceOf_Hz5CXSixvuIi4kfmSyS0EUf_IHA',
    secretKey: 'GyROCzIRovuO31v82vBmPFVcpwY2pbmtszzUwJeRr6NkbXi2ttKqiVTAXwjPQyXM3c75FX4m8ZCh0NW8Zxi6gA'
});

describe('Cloudstack module test suite', function(){

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
