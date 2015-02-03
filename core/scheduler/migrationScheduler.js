module.exports = function () {

    var db = require('../db');
    var Hosts = require('../db/schemas/dbHost');
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
            else {
                return false;
            }
        }
    };

    var findMinHost = function (hostsInfo, authorizedRequest) {

        var askingMemory = authorizedRequest.requestContent.group[0].min_memory[0].size[0];

        switch (authorizedRequest.requestContent.group[0].min_memory[0].unit[0].toLowerCase()) {
            case 'b':
                break;
            case 'kb':
                askingMemory = askingMemory * 1024;
                break;
            case 'mb':
                askingMemory = askingMemory * 1024 * 1024;
                break;
            case 'gb':
                askingMemory = askingMemory * 1024 * 1024 * 1024;
                break;
            case 'tb':
                askingMemory = askingMemory * 1024 * 1024 * 1024 * 1024;
                break;
            default:
                return false;
        }

        var minMemHostIndex = 0;
        var minMemHost = hostsInfo[minMemHostIndex];
        var minMemory = getValueByZabbixKey(hostsInfo[minMemHostIndex], 'system.memory.size[available]');

        for (var i = 0; i < hostsInfo.length; i++) {
            var currentHostMemory = getValueByZabbixKey(hostsInfo[i], 'system.memory.size[total]');
            if (currentHostMemory < minMemory) {
                minMemory = currentHostMemory;
                minMemHostIndex = i;
                minMemHost = hostsInfo[i];
            }
        }

        return hostsInfo.splice(minMemHostIndex, 1);

    };

    var findHostByMigration = function (authorizedRequest, allPossibleHosts, callback) {

        var candidate = findMinHost(allPossibleHosts, authorizedRequest);

        Hosts.find({ zabbixID: candidate.hostId }).exec(function (err, result) {
            if(err){
                callback(response.error(500, "Database error!", err));
            }
            else{

                var vmList = [];

                cloudstack.execute('listVirtualMachines', { hostid: result.cloudstackID }, function(err, result){

                    if(err){
                        callback(response.error(500, 'Cloudstack Error!', err));
                    }
                    else{
                        var vmListResponse = result.listvirtualmachinesresponse.virtualmachine; //TODO: need to check the reponse format

                        getVMSpecs(0, vmListResponse, vmList, function (err, vmList) {
                            Hosts.find({}).exec(function (err, hostArray) {
                                if(err){
                                    callback(response.error(500, 'Database Error', err));
                                }
                                else{
                                    checkVMMigratability(vmList, hostArray, 0, allPossibleHosts, _.clone(allPossibleHosts));
                                }
                            });
                        });

                    }

                });

                //callback(null, "This is the selected host by migration scheduler");
            }
        });

    };


    //TODO: Needs testing
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

                    getVMSpecs(++vmIndex, vmListResponse, vmList, callback);
                }
            });
        }
    };


    //TODO: Needs testing
    var checkVMMigratability = function (vmList, hostInfo, hostIndex, currentUtilizationInfo, predictedUtilizationInfo) {
        //Setting up vmList array in to decreasing order of memory
       vmList.sort(compareDescending());
        console.log(vmList);
    };

    var compareDescending =function (attribute1, attribute2) {
        if(attribute1>attribute2){
            return -1;
        }
        else if(attribute1<attribute2){
            return 1;
        }
        else if(attribute1 == attribute2){
            return 0;
        }

    };

    return {
        findHostByMigration: findHostByMigration
    }
};
