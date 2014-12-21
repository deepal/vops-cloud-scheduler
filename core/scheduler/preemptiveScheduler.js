module.exports = function(){

    var response = require('../../config/responseMessages');
    var _ = require('underscore');
    var unitConverter =require('../../core/util/unitConverter')();

    var cloudstack = new (require('csclient'))({
        serverURL: CLOUDSTACK.API,
        apiKey: CLOUDSTACK.API_KEY,
        secretKey: CLOUDSTACK.SECRET_KEY
    });

    var findHostByPreemption = function(authorizedRequest, allocations, possibleMemoryHosts, callback){

        //first obtain preemptable hosts in possibleMemoryHosts which has one or more minPriorityAllocations.
        getPreemptableHosts(allocations, 0, possibleMemoryHosts,  function(err, preemptableHosts){
            if(!err){
                //Then consider the  minimum Priority allocation from remaining unchecked allocations
                var  minPriorityAllocations = _.clone(allocations);
                findHostForPreemption(authorizedRequest, minPriorityAllocations, preemptableHosts, function (err, hostForPreemption) {
                    if(!err){
                        callback(null, hostForPreemption);
                    }
                    else{
                        callback(err);
                    }
                });
                //check for the memory if that is preempted
                //if a host is returned with sufficient memory callbalck the host

                //else consider next low priority allocations
            }
            else{
                callback(err);
            }

        });

        //Then what is the sufficient minimum memory which can be resulted by a certain preemption.
        //when do preemption do it in the least priority order.


    };

    var getPreemptableHosts = function(allocations, allocationIndex, possibleMemoryHosts, callback){

        var preemptableHosts =[];

        if(allocationIndex > allocations.length ) {
            callback(null, preemptableHosts);
        }
        else {
            cloudstack.execute('listVirtualMachines', {groupid: allocations[allocationIndex]}, function (err, result) {
                if (!err) {
                    var vmList = result;
                    getVmInfo(allocations, allocationIndex, possibleMemoryHosts, preemptableHosts, vmList, 0, function (err, preemptableHosts) {
                        if (!err) {
                            for (var i = 0; i < vmList.length; i++) {
                                for (var j = 0; j < preemptableHosts.length; j++) {
                                    if (vmList[i].hostid == possibleMemoryHosts[j].hostId) {
                                        preemptableHosts.push({
                                            hostId: possibleMemoryHosts[j].hostId,
                                            allocations: []
                                        });
                                    }
                                }
                            }
                            allocationIndex++;
                            getPreemptableHosts(allocations, allocationIndex, possibleMemoryHosts, callback);
                        }
                        else{
                            callback(err);
                        }
                    });
                }
                else {
                    callback(err);
                }
            });
        }

    };

    var getVmInfo = function(allocations, allocationIndex, possibleMemoryHosts, preemptableHosts, vmList, vmIndex, callback){
        if(vmIndex> vmList.length ){
            callback(null, preemptableHosts);
        }
        else{
            for(var i=0; i<preemptableHosts.length; i++){
                if(vmList[vmIndex].hostid == preemptableHosts[i].hostid){
                    preemptableHosts[i].allocations.push(vmList[vmIndex]);
                }
            }
            vmIndex++;
            getVmInfo(allocations, allocationIndex, possibleMemoryHosts, preemptableHosts, vmList, vmIndex, callback);
        }
    };

    var findHostForPreemption = function(authorizedRequest, minPriorityAllocations, preemptableHosts,callback){
        //get the minimum priority allocation from min allocations
        for(var i=0; i< minPriorityAllocations.length - 1; i++){
            if(minPriorityAllocations[i].allocationPriority < minPriorityAllocations[i+1].allocationPriority){
                var leastPriorityAllocation = _.clone(minPriorityAllocations[i]);
            }
        }

        var memorySize = parseInt(leastPriorityAllocation.allocationRequestContent.group[0].min_memory[0].size[0]);
        var memoryUnit = leastPriorityAllocation.allocationRequestContent.group[0].min_memory[0].unit[0];
        var memoryInAllocation = unitConverter.convertMemoryAndStorage(memorySize,memoryUnit, 'b');

        var requestedMemorySize = parseInt(authorizedRequest.allocationRequestContent.group[0].min_memory[0].size[0]);
        var requestedMemoryUnit = authorizedRequest.allocationRequestContent.group[0].min_memory[0].unit[0];
        var requestedMemory = unitConverter.convertMemoryAndStorage(requestedMemorySize,requestedMemoryUnit, 'b');

        //check memory allocation for that allocation in each host
    };




    return {
        findHostByPreemption: findHostByPreemption
    }
};
