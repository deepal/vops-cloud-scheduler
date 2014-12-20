var unitConverter = require('../core/util/unitConverter')();
var should = require('should');

describe('Unit Converter test suite', function () {

    it('Memory and Storage Converter test failed', function (done) {
        unitConverter.convertMemoryAndStorage(2048, 'mb', 'gb').should.equal(2);
        done();
    });

    it('Frequency Converter test failed', function(done){
        unitConverter.convertFrequency(2000000, 'hz', 'mhz').should.equal(2);
        done();
    });

});