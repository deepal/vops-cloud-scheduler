module.exports = function(){
    var unitConverter = require('../util/unitConverter')();
    var response = require('../../config/responseMessages');
    var db = require('../db');
    var Allocation = require('../db/schemas/dbAllocation');
    var DBHost = require('../db/schemas/dbHost');
    var DBQueuedRequest = require('../db/schemas/dbQueuedRequest');
    var DBPreemptedJob = require('../db/schemas/dbpreemptedJob');
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
                if(result.length ==0){
                    callback(response.error(200, ERROR.REQUEST_QUEUED));

                    var queuedRequest = new DBQueuedRequest({
                        timestamp: Date.now(),
                        userSession: authorizedRequest.session,
                        requestPriority: authorizedRequest.requestContent.group[0].priority[0],
                        request: authorizedRequest.requestContent
                    });

                    queuedRequest.save(function (err) {
                        if(err){
                            console.log("[!] Database error occured while saving queued request");
                        }
                        else{
                            console.log("[+] Queued Request Saved In database!");
                        }
                    });

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

                            console.log('[...] Trying to preempt Virtual machines [ '+ requestParams.vmIDs+" ]");

                            var req = client.post(SERVICES.PREEMPTION_SERVICE_URL, args, function (resData, rawRes) {
                                if(resData.status ==200){
                                    DBHost.findOne({ ipAddress: resData.message }).exec(function (err, host) {
                                        if(err){
                                            callback(response.error(500, ERROR.DB_CONNECTION_ERROR, err));
                                        }
                                        else{
                                            callback(null, host);

                                            savePreemptedVMsInDB(0, authorizedRequest, requestParams.vmIDs, function (err) {
                                                if(!err){
                                                    console.log('[+] Preempted request saved in database!');
                                                }
                                            });
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

            }
        });


    };

    var savePreemptedVMsInDB = function (index, authorizedRequest, vmIDs, callback) {
        if(index >= vmIDs.length){
            callback(null);
        }
        else{

            var preemptedJob = new DBPreemptedJob({
                jobPriority: authorizedRequest.requestContent.group[0].priority[0],
                preemptionTimestamp: Date.now(),
                jobContent: authorizedRequest.requestContent
            });

            preemptedJob.save(function (err) {
                if(err){
                    console.log("[-] Error occured when saving preempted request in database! ");
                }
                else{
                    Allocation.remove({
                        'VM.InstanceName': vmIDs[index]
                    }, function (err) {
                        if(err){
                            console.log('[-] Error removing allocation from database ! ');
                        }
                        else{
                            index++;
                            savePreemptedVMsInDB(index, authorizedRequest, vmIDs, callback);
                        }
                    });
                }
            });
        }
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
            callback(response.error(200, ERROR.REQUEST_QUEUED));    //if there is no suitable host for the request, queue request and return message

            var highPriorityQueuedAlloc = new DBQueuedRequest({
                timestamp: Date.now(),
                userSession: authorizedRequest.session,
                requestPriority: authorizedRequest.requestContent.group[0].priority[0],
                request: authorizedRequest.requestContent
            });

            highPriorityQueuedAlloc.save(function (err) {
                if(err){
                    console.log("[!] Error occured saving request in database ! Error info: "+JSON.stringify(err));
                }
                else{
                    console.log("[!]  Queued Request Saved In database! ");
                }
            });

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
