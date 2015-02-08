module.exports = function(){
    var unitConverter = require('../util/unitConverter')();
    var findHostByPreemption = function (authorizedRequest, allocations, allPossibleHosts, callback) {
        var requestingMemoryBytes = unitConverter.convertMemoryAndStorage(authorizedRequest.requestContent.group[0].min_memory[0].size[0], authorizedRequest.requestContent.group[0].min_memory[0].unit[0],'b');

    };

    return {
        findHostByPreemption: findHostByPreemption
    }
};
