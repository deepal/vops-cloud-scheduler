module.exports = function(){
    var unitConverter = require('../util/unitConverter')();
    var response = require('../../config/messages');
    var findHostByPreemption = function (authorizedRequest, allPossibleHosts, callback) {

        var requestingMemoryBytes = unitConverter.convertMemoryAndStorage(authorizedRequest.requestContent.group[0].min_memory[0].size[0], authorizedRequest.requestContent.group[0].min_memory[0].unit[0],'b');

        var freedMemoryBytes = 0;
        var preemptableVMs = [];
        var vmSearchDone = false;
        var vmMem= 0, cpuFreq= 0,cpuCores= 0;

        getPreemptableAllocationsStrategy({
            'AllocationInfo.Priority': {    //search strategy
                $lt: 4
            }
        },{
            'AllocationInfo.Priority':1     //sorting strategy
        }, function (err, allocations) {

            for(var i=0;i<allocations.length;i++){

                if(freedMemoryBytes> requestingMemoryBytes){
                    vmSearchDone = true;
                }
                else{
                    vmMem = parseInt(allocations[i].VM.Memory);
                    cpuFreq = parseFloat(allocations[i].VM.CPUFreq);
                    cpuCores = parseInt(allocations[i].VM.CPUCount);


                    freedMemoryBytes += vmMem;

                    preemptableVMs.push({
                        VMName: allocations[i].VM.InstanceName,
                        hostIP: allocations[i].VM.HostInfo.IPAddr
                    });
                }

            }

        });



    };

    var getPreemptableAllocationsStrategy = function (findStrategy, sortStrategy, callback) {   // Implements a VM search strategy
        Allocations.find(findStrategy).sort(sortStrategy).exec(function (err, allocations) {
            if(err){
                callback(response.error(500, ERROR.DB_CONNECTION_ERROR, err));
            }
            else{
                if(allocations){
                    if(allocations.length){
                        //there are allocation with less priority than the coming, they can be preempted if useful
                        callback(null, allocations);

                    }
                    else{
                        callback(response.error('200',ERROR.NO_RESOURCES_TO_ALLOCATE));
                    }
                }
                else{
                    callback(responseMessage.error(200, 'Database returned none'));
                }
            }
        });
    };


    return {
        findHostByPreemption: findHostByPreemption
    }
};
