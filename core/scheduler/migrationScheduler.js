module.exports = function () {

    var db = require('../db');
    var Hosts = require('../db/schemas/dbHost');
    var VMAllocations = require('../db/schemas/dbAllocation');
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

        findHost(hostsInfo, allPossibleHosts, authorizedRequest, function(err, candidateHost){
            if(!err){
                callback(null, candidateHost);
            }
            else{
                callback(err);
            }
        });
    };

    var findHost = function(hostsInfo, allPossibleHosts, authorizedRequest, callback){

        var candidate = findMaxMemHost(hostsInfo, authorizedRequest);
        var askingMemory = unitConverter.convertMemoryAndStorage(authorizedRequest.requestContent.group[0].min_memory[0].size[0],authorizedRequest.requestContent.group[0].min_memory[0].unit[0], 'b');

        var migrationHosts =[];

        //todo:needs testing
        for(var i=0; i< allPossibleHosts.length; i++){
            if(allPossibleHosts[i]!=candidate){
                migrationHosts.push(allPossibleHosts[i]);
            }
        }


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

                        //if there are virtual machines in that host
                        if(vmListResponse) {


                            getVMSpecs(0, vmListResponse, vmList, function (err, vmList) {
                                Hosts.find({}).exec(function (err, hostArray) {
                                    if (err) {
                                        callback(response.error(500, 'Database Error', err));
                                    }
                                    else {
                                        //migration allocation array is created from the candidate that has chosen(migrating that VMs)

                                        var migrations = [];
                                        //if migrationHosts is null, that means no other host to migrate
                                        if (migrationHosts) {
                                            //todo: needs testing
                                            if (checkVMMigratability(vmList, hostArray, migrationHosts, migrations)) {
                                                //perform migration
                                                performMigration(migrations, 0, function(err, migrationPerformed, migrationAllocation){
                                                    //candidate migrated vms and suitable for allocation
                                                    if(migrationPerformed) {
                                                        Hosts.findOne({ zabbixID: candidate.hostId }).exec(function (err, host){
                                                            if(!err){
                                                                callback(null, host);
                                                            }
                                                            else{
                                                                callback(err);
                                                            }
                                                        });

                                                        //todo: database update for each VM(needs testing)
                                                       // var i=0;
                                                        /*VMAllocations.findOne({'VM.VMID' : migrationAllocation[i].vmId}).exec(function(err, item){
                                                            var conditions = {'VM.VMID' : migrationAllocation[i].vmId};
                                                           // var update = {$set:{'VM.HostInfo': }}


                                                           /* var conditions = {zabbixItemID: hostStats[statHostIndex].itemInfo[statItemIndex].itemId};
                                                            var update = {$set: {ewma_last: hostStats[statHostIndex].itemInfo[statItemIndex].value, last_updated: Date.now()}};
                                                            var options = {upsert: true};

                                                            EwmaSchema.update(conditions, update, options, function (err) {
                                                                if (!err) {
                                                                    statItemIndex++;
                                                                    updateDBInfoPerItem(statHostIndex, statItemIndex, hostStats, callback);
                                                                }
                                                                else {
                                                                    callback(err);
                                                                }
                                                            });
                                                        });*/

                                                    }
                                                    else{
                                                        callback(err);
                                                    }
                                                });
                                            }
                                            else {
                                                findHost(hostsInfo, allPossibleHosts, authorizedRequest, callback);
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
                        //if there are no virtual machines check whether the memory is suffiecient
                        else if(askingMemory <= getValueByZabbixKey(candidate, 'vm.memory.size[available]')){
                            callback(null, candidate);
                        }
                        //if both doesn't work call for next hosts
                        else if(hostsInfo.length>= 0){
                            findHost(hostsInfo, allPossibleHosts, authorizedRequest, callback);
                        }
                        //if nothing works no candidate host is there
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
    var checkVMMigratability = function (vmList, hosts, migrationHosts, migrations) {

        var vmCount =0;

        //Setting up vmList array in to decreasing order of memory
       vmList.sort(function(a,b){return b.memory - a.memory});

        var hostMemInfo = [];
        for(var i=0; i< migrationHosts.length; i++){
            var hostMemory = getValueByZabbixKey(migrationHosts[i], 'vm.memory.size[available]');
            hostMemInfo.push({hostId: migrationHosts[i].hostId,
                                memory: hostMemory});
        }
        hostMemInfo.sort(function(a,b){return b.memory - a.memory});

                for (var i = 0; i < vmList.length; i++) {
                    for (var j=0; j< hostMemInfo.length; j++) {
                    var vmMemory = unitConverter.convertMemoryAndStorage(vmList[i].memory, 'mb', 'b');

                    if (vmMemory <= hostMemInfo[j].memory) {

                        migrations.push({
                            vmId : vmList[i].vmID,
                            migrationHostId: hostMemInfo[j].hostId
                        });
                        //tempUsedMemory = tempUsedMemory + vmMemory;
                        hostMemInfo[j].memory = hostMemInfo[j].memory- vmMemory;
                        vmCount++;
                        if(vmCount==vmList.length){
                          return true;
                        }
                        //break the loop and consider putting next vm to the host list
                        break;

                    }
                }

            }
        return false;
    };


    var performMigration = function(migrationAllocation, vmIndex,callback){

        if(vmIndex >= migrationAllocation.length){
            callback(null, true, migrationAllocation);
        }
        else{
            Hosts.findOne({ zabbixID: migrationAllocation[vmIndex].migrationHostId }).exec(function (err, hostIds) {
                cloudstack.execute('migrateVirtualMachine', {virtualmachineid:migrationAllocation[vmIndex].vmId, hostid:hostIds.cloudstackID}, function(err, res){
                    if(!err){
                        vmIndex++;
                        performMigration(migrationAllocation, vmIndex, callback);
                    }
                    else{
                        callback(err);
                    }
                });
            });

        }

    };



    return {
        findHostByMigration: findHostByMigration
    }
};
