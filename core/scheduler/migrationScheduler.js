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

        var maxMemHostIndex;
        var maxMemHost;
        var maxMemory;

        for (var i = 0; i < hostsInfo.length-1; i++) {
            var currentMemory = getValueByZabbixKey(hostsInfo[i], 'vm.memory.size[available]');
            var nextHostMemory = getValueByZabbixKey(hostsInfo[i+1], 'vm.memory.size[available]');
            var currentTotalMemory= getValueByZabbixKey(hostsInfo[i], 'vm.memory.size[total]');
            var nextHostTotalMemory = getValueByZabbixKey(hostsInfo[i+1], 'vm.memory.size[total]');

            if ((nextHostMemory > currentMemory)&& askingMemory<= nextHostTotalMemory) {
                maxMemory = nextHostMemory;
                maxMemHostIndex = i+1;
                maxMemHost = _.clone(hostsInfo[i+1]);
            }
            else if(askingMemory <= currentTotalMemory){
                maxMemory = currentMemory;
                maxMemHostIndex = i;
                maxMemHost = _.clone(hostsInfo[i]);
            }
            else
                return null;
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
        var askingMemory = unitConverter.convertMemoryAndStorage(authorizedRequest.requestContent.group[0].min_memory[0].size[0],authorizedRequest.requestContent.group[0].min_memory[0].unit[0], 'b');
        //migration allocation array is created from the candidate that has chosen(migrating that VMs)
        var migrationInfo = [];

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

                        //if(result.listvirtualmachineresponse.virtualmachine) {
                            var vmListResponse = result.listvirtualmachinesresponse.virtualmachine;
                       // }
                       // else{
                          // callback(null, candidate)
                      //  }
                        if(vmListResponse) {


                            getVMSpecs(0, vmListResponse, vmList, function (err, vmList) {
                                Hosts.find({}).exec(function (err, hostArray) {
                                    if (err) {
                                        callback(response.error(500, 'Database Error', err));
                                    }
                                    else {
                                        //if hostsInfo is null, that mean no other host to migrate
                                        if (hostsInfo != null) {
                                            if (checkVMMigratability(vmList, hostArray, hostsInfo, migrationInfo)) {
                                                //perform migration
                                                performMigration(migrationInfo, 0, callback);
                                                //candidate migrated vms and suitable for allocation
                                                callback(null, candidate);
                                            }
                                            else {
                                                findHost(hostsInfo, authorizedRequest, callback);
                                            }
                                        }
                                        else {
                                            //if all hosts are checked and no suitable host found? return empty
                                            callback(null, null);
                                        }
                                    }
                                });
                            });
                        }

                        else if(askingMemory <= getValueByZabbixKey(candidate, 'vm.memory.size[available]')){
                            callback(null, candidate);
                        }

                        else if(hostsInfo!= null){
                            findHost(hostsInfo, authorizedRequest, callback);
                        }

                        else{
                            callback(null, null);
                        }

                    }
                });
            }
        });
    };


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
    var checkVMMigratability = function (vmList, hosts, hostsInfo, migrationInfo) {

        var hostIndex =0;
        var vmCount =0;

        //Setting up vmList array in to decreasing order of memory
       vmList.sort(function(a,b){return b.memory - a.memory});

        var hostMemInfo = [];
        for(var i=0; i< hostsInfo.length; i++){
            var hostMemory = getValueByZabbixKey(hostsInfo[i], 'vm.memory.size[available]');
            hostMemInfo.push({hostId: hostsInfo[i].hostId,
                                memory: hostMemory});
        }
        hostMemInfo.sort(function(a,b){return b.memory - a.memory});


        for (var j=0; j< hostMemInfo.length; j++) {
                for (var i = 0; i < vmList.length; i++) {

                    var vmMemory = unitConverter.convertMemoryAndStorage(vmList[i].memory, 'mb', 'b');



                   // var tempUsedMemory = 0;
                   // var hostMemory = getValueByZabbixKey(hostsInfo[hostIndex], 'vm.memory.size[available]');


                    if (vmMemory <= hostMemInfo[j].memory) {
                       /* if (migrationInfo.length == 0) {
                            migrationInfo.push({
                                hostId: vmList[i].hostID,
                                vmAllocations: []
                            });
                            migrationInfo[0].vmAllocations.push(vmList[i]);

                        }
                        else {
                            if (containsHostId(vmList[i].hostID, migrationInfo)) {
                                for (var k = 0; k < migrationInfo.length; k++) {
                                    if (migrationInfo[k].hostId == vmList[i].hostID) {
                                        migrationInfo[k].vmAllocations.push(vmList[i]);
                                        break;
                                    }
                                }
                            }
                            else {

                                migrationInfo.push({
                                    hostId: vmList[i].hostID,
                                    vmAllocations: []
                                });
                                migrationInfo[migrationInfo.length - 1].vmAllocations.push(vmList[i]);

                            }
                        }*/
                        migrationInfo.push(vmList[i]);
                        //tempUsedMemory = tempUsedMemory + vmMemory;
                        hostMemInfo[j].memory = hostMemInfo[j].memory- vmMemory;
                        vmCount++;
                        if(vmCount==vmList.length){
                            return true;
                        }
                        continue;

                    }
                }

            }
        return false;
    };

   /* var containsHostId = function(value, attributes){
        for(var i=0; i< attributes.length; i++){
            if(value == attributes[i].hostId){
                return true;
            }
        }
        return false;
    };*/

    var performMigration = function(migrationAllocation, vmIndex,callback){

        if(vmIndex >= migrationAllocation.length){
            callback(null, null);
        }
        else{
            cloudstack.execute('migrateVirtualMachine', {virtualmachineid:migrationAllocation[vmIndex].vmID, hostid:migrationAllocation[vmIndex].hostID}, function(err, res){
                if(!err){
                    vmIndex++;
                    performMigration(migrationAllocation, vmIndex, callback);
                }
                else{
                    callback(err);
                }
            });
        }

    };



    return {
        findHostByMigration: findHostByMigration
    }
};
