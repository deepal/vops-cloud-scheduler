module.exports = function(){
    var unitConverter = require('../util/unitConverter')();
    var response = require('../../config/responseMessages');
    var db = require('../db');
    var Allocation = require('../db/schemas/dbAllocation');
    var DBHost = require('../db/schemas/dbHost');
    var restClient = require('node-rest-client').Client;
    var client = new restClient();
    var findHostByPreemption = function (authorizedRequest, allPossibleHosts, callback) {

        //Get list of hosts in the ascending order of the VM count, get the list sorted
        Allocation.aggregate([
            {
                $match: {
                    'AllocationInfo.Priority': {
                        $lt: parseInt(authorizedRequest.requestContent.group[0].priority[0])
                    }
                }
            },
            {
                $group:{
                    _id: "$VM.HostInfo.IPAddr",
                    count: { $sum: 1}
                }
            },
            {
                $sort: { count: 1}
            }

        ], function (err, result) {
            if(err){
                callback(response.error(500, ERROR.DB_CONNECTION_ERROR, err));
            }
            else{
                var hostArray = []; //put each host IP in a String array to send to 'chechEachHostForPreemption'
                for(var i=0;i<result.length;i++){
                    hostArray.push(result[i]._id);
                }

                checkEachHostForPreemption(0, authorizedRequest, hostArray, function (err, selectedHostIP, preemptableVMs) {
                    if(err){
                        callback(err);
                    }
                    else if(selectedHostIP){    //get the selectedHostIP from the method, and call JVirshService with REST client

                        var requestParams = {};

                        requestParams.vmIDs = preemptableVMs;
                        requestParams.hostIP = selectedHostIP;

                        var args = {
                            data: requestParams,
                            headers:{"Content-Type": "application/json"}    // ask response type to be application/json-rpc
                        };

                        var req = client.post('http://10.10.13.63:8080/preempt', args, function (resData, rawRes) {
                            if(resData.status ==200){
                                DBHost.findOne({ ipAddress: resData.message }).exec(function (err, host) {
                                    if(err){
                                        callback(response.error(500, ERROR.DB_CONNECTION_ERROR, err));
                                    }
                                    else{
                                        callback(null, host);
                                    }
                                });
                            }
                            else if(resData.status == 500){
                                callback(response.error(500, ERROR.INTERNAL_JVIRSH_ERROR, resData.message));
                            }
                            else{
                                callback(response.error(500, ERROR.UNKNOWN_ERROR, null));
                            }
                            //If all VMs preemtped, shemil will(mmm... he SHOULD !!) send IP of the host back with OK message.
                        });

                        req.on('error', function (err) {
                            callback(response.error(500, ERROR.JVIRSH_SERVICE_ERROR, err));
                        });
                    }
                    else{
                        callback(null);
                    }
                });

            }
        });


    };

    var getPreemptableAllocationsStrategy = function (findStrategy, sortStrategy, callback) {   // Implements a VM search strategy
        Allocation.find(findStrategy).sort(sortStrategy).exec(function (err, allocations) {
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
                    callback(responseMessage.error(200, 'Database returned none')); //there are no allocation with priority less than the coming OR currently there are no allocations at all
                }
            }
        });
    };

    var checkEachHostForPreemption = function(index, authorizedRequest, allDBHostIPs, callback){

        if(index >= allDBHostIPs.length){
            callback(null);
        }
        else{
            var selectedHostIP = allDBHostIPs[index];

            var requestingMemoryBytes = unitConverter.convertMemoryAndStorage(authorizedRequest.requestContent.group[0].min_memory[0].size[0], authorizedRequest.requestContent.group[0].min_memory[0].unit[0],'b');

            var freedMemoryBytes = 0;
            var preemptableVMs = [];
            var suitableForPreemption = false;
            var vmMem= 0, cpuFreq= 0,cpuCores= 0;

            getPreemptableAllocationsStrategy({
                'AllocationInfo.Priority': {    //search strategy
                    $lt: authorizedRequest.requestContent.group[0].priority[0]
                },
                'VM.HostInfo.IPAddr': selectedHostIP
            },{
                'AllocationInfo.Priority':1     //sorting strategy
            }, function (err, allocations) {

                for(var i=0;i<allocations.length;i++){

                    if(freedMemoryBytes> requestingMemoryBytes){
                        suitableForPreemption = true;
                        break;
                    }
                    else{
                        vmMem = parseInt(allocations[i].VM.Memory);
                        cpuFreq = parseFloat(allocations[i].VM.CPUFreq);
                        cpuCores = parseInt(allocations[i].VM.CPUCount);


                        freedMemoryBytes += vmMem;

                        preemptableVMs.push(allocations[i].VM.InstanceName);
                    }
                }

                if(suitableForPreemption){
                    callback(null, selectedHostIP, preemptableVMs);
                }
                else{
                    index++;
                    checkEachHostForPreemption(index, authorizedRequest, allDBHostIPs, callback);
                }
            });
        }

    };


    return {
        findHostByPreemption: findHostByPreemption
    }
};
