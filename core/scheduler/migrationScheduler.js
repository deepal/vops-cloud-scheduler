module.exports = function () {

    var db = require('../db');
    var Hosts = require('../db/schemas/dbHost');
    var unitConverter = require('../util/unitConverter')();
    var _ = require('underscore');
    var cloudstack = new (require('csclient'))({
        serverURL: CLOUDSTACK.API,
        apiKey: CLOUDSTACK.API_KEY,
        secretKey: CLOUDSTACK.SECRET_KEY
    });

    var response = require('../../config/responseMessages');

    var getValueByZabbixKey = function (host, key) {
        for (var i = 0; i < host.itemInfo.length; i++) {
            if (host.itemInfo[i].itemKey == key) {
                return host.itemInfo[i].value;
            }
        }
        return false;
    };

    var findMaxMemHost = function (hostsInfo, authorizedRequest) {

        var askingMemory = unitConverter.convertMemoryAndStorage(authorizedRequest.requestContent.group[0].min_memory[0].size[0],authorizedRequest.requestContent.group[0].min_memory[0].unit[0], 'b');

        var maxMemHostIndex = 0;
        var maxMemHost = _.clone(hostsInfo[maxMemHostIndex]);
        var maxMemory = getValueByZabbixKey(hostsInfo[maxMemHostIndex], 'vm.memory.size[available]');

        for (var i = 0; i < hostsInfo.length; i++) {
            var currentHostMemory = getValueByZabbixKey(hostsInfo[i], 'vm.memory.size[available]');
            if ((currentHostMemory > maxMemory) && (askingMemory < currentHostMemory)) {
                maxMemory = currentHostMemory;
                maxMemHostIndex = i;
                maxMemHost = _.clone(hostsInfo[i]);
            }
        }

        return hostsInfo.splice(maxMemHostIndex,1)[0];

    };

    var findHostByMigration = function (authorizedRequest, allPossibleHosts, callback) {

        var hostsInfo = _.clone(allPossibleHosts);
        findHost(hostsInfo, authorizedRequest, function(err, candidateHost){
            if(!err){
                callback(null, candidateHost);
            }
            else{
                callback(err);
            }
        });
    };

    var findHost = function(hostsInfo, authorizedRequest, callback){

        var candidate = findMaxMemHost(hostsInfo, authorizedRequest);

        Hosts.findOne({ zabbixID: candidate.hostId }).exec(function (err, hostIds) {
            if(err){
                callback(response.error(500, "Database error!", err));
            }
            else{

                var vmList = [];

                cloudstack.execute('listVirtualMachines', { hostid: hostIds.cloudstackID }, function(err, result){

                    if(err){
                        callback(response.error(500, 'Cloudstack Error!', err));
                    }
                    else{
                        var vmListResponse = result.listvirtualmachinesresponse.virtualmachine;

                        getVMSpecs(0, vmListResponse, vmList, function (err, vmList) {
                            Hosts.find({}).exec(function (err, hostArray) {
                                if(err){
                                    callback(response.error(500, 'Database Error', err));
                                }
                                else{
                                    //if hostsInfo is null, that mean no other host to migrate
                                    while(hostsInfo != null) {
                                        if (checkVMMigratability(vmList, hostArray, hostsInfo)) {
                                            //candidate to migrate Vms from
                                            callback(null, candidate);
                                        }
                                        else {
                                            findHost(hostsInfo, authorizedRequest);
                                        }
                                    }
                                    //if all hosts are checked and no suitable host found? return empty
                                    callback(null, null);
                                }
                            });
                        });
                    }
                });

                //callback(null, "This is the selected host by migration scheduler");
            }
        });
    }


    var getVMSpecs = function (vmIndex, vmListResponse, vmList, callback) {
        if(vmIndex == vmListResponse.length){
            callback(null, vmList);
        }
        else{
            var vmID = vmListResponse[vmIndex].id;
            var vmHostID = vmListResponse[vmIndex].hostid;
            var serviceOfferingId= vmListResponse[vmIndex].serviceofferingid;

            cloudstack.execute('listServiceOfferings', {id: serviceOfferingId}, function (err, result) {
                if (err) {
                    callback(response.error(500, 'Cloudstack Error!', err));
                }
                else {
                    var serviceOffering = result.listserviceofferingsresponse.serviceoffering[0];

                    vmList[vmIndex] = {
                        vmID: vmID,
                        hostID: vmHostID,
                        detailedInfo: vmListResponse[vmIndex],
                        numOfCores: serviceOffering.cpunumber,
                        cpuFreq: serviceOffering.cpuspeed,
                        memory: serviceOffering.memory,
                        storageType: serviceOffering.storagetype,
                        offerHA: serviceOffering.offerha
                    };
                    vmIndex++;
                    getVMSpecs(vmIndex, vmListResponse, vmList, callback);
                }
            });
        }
    };


    //TODO: Needs testing
    var checkVMMigratability = function (vmList, hosts, hostsInfo) {
        var migrationAllocation = [];
        var hostIndex =0;
        var vmCount =0;

        //Setting up vmList array in to decreasing order of memory
       vmList.sort(function(a,b){return b.memory - a.memory});


            while(hostIndex < hostsInfo.length) {

                for (var i = 0; i < vmList.length; i++) {

                    var tempUsedMemory = 0;
                    var hostMemory = getValueByZabbixKey(hostsInfo[hostIndex], 'vm.memory.size[available]');

                    var vmMemory = unitConverter.convertMemoryAndStorage(vmList[i].memory, 'mb', 'b');

                    if (vmMemory <= hostMemory - tempUsedMemory) {
                        if (migrationAllocation.length == 0) {
                            migrationAllocation.push({
                                hostId: vmList[i].hostID,
                                vmAllocations: []
                            });
                            migrationAllocation[0].vmAllocations.push(vmList[i]);

                        }
                        else {
                            if (containsHostId(vmList[i].hostID, migrationAllocation)) {
                                for (var k = 0; k < migrationAllocation.length; k++) {
                                    if (migrationAllocation[k].hostId == vmList[i].hostID) {
                                        migrationAllocation[k].vmAllocations.push(vmList[i]);
                                        break;
                                    }
                                }
                            }
                            else {
                                containsHostId(vmList[i].hostID, migrationAllocation);
                                migrationAllocation.push({
                                    hostId: vmList[i].hostID,
                                    vmAllocations: []
                                });
                                migrationAllocation[migrationAllocation.length - 1].vmAllocations.push(vmList[i]);

                            }
                        }
                        tempUsedMemory = tempUsedMemory + vmMemory;
                        vmCount++;
                        if(vmCount==vmList.length){
                            return true;
                        }

                    }
                    else {
                        hostIndex++;
                        continue;
                        }
                }

            }
        return false;
    };

    var containsHostId = function(value, attributes){
        for(var i=0; i< attributes.length; i++){
            if(value == attributes[i].hostId){
                return true;
            }
        }
        return false;
    }

    return {
        findHostByMigration: findHostByMigration
    }
};
