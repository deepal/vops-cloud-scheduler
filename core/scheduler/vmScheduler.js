module.exports = function (zSession) {
    var authService = require('../auth/authService')();
    var db = require('../db');
    var Allocation = require('../db/schemas/dbAllocation');
    var DBHost = require('../db/schemas/dbHost');
    var response = require('../../config/responseMessages');
    var unitConverter = require('../../core/util/unitConverter')();


    var cloudstack = new (require('csclient'))({
        serverURL: CLOUDSTACK.API,
        apiKey: CLOUDSTACK.API_KEY,
        secretKey: CLOUDSTACK.SECRET_KEY
    });

    //TODO: Pending test
    var requestForAllocation = function (jsonAllocRequest, callback) {

        authService.authorizeResourceRequest(jsonAllocRequest, function (err, authorizedRequest) {
            if (err) {
                callback(err);
            }
            else {
                console.log(JSON.stringify(authorizedRequest));
                var hostFilter = new (require('./hostFilter'))(authorizedRequest.requestContent);
                hostFilter.fetchCloudInfo(zSession, function (err, filteredHostsInfo, allPossibleHosts) {

                    if (filteredHostsInfo.length == 0) {
                        var priorityScheduler = new (require('./priorityScheduler'))();
                        /// do whatever you do with priority scheduler
                        priorityScheduler.scheduleRequest(authorizedRequest, allPossibleHosts, function (err, selectedHost) {
                            // results returned from migration scheduler or preemptive scheduler
                            if (!err) {

                                //TODO: remove this
                                callback(null, selectedHost);

                                //allocateRequest(selectedHost, authorizedRequest, function (err, result) {
                                //    if(err){
                                //        callback(err);
                                //    }
                                //    else{
                                //        callback(null, result);
                                //    }
                                //});
                            }
                            else {
                                callback(err);
                            }
                        });
                    }
                    else {
                        //console.log("Selected Host: " + JSON.stringify(filteredHostsInfo[0]));
                        findBestHost(filteredHostsInfo, authorizedRequest, function (err, bestHost) {
                            if(err){
                                callback(err);
                            }
                            else{
                                allocateRequest(bestHost, authorizedRequest, function (err, result) {
                                    if (err) {
                                        callback(err);
                                    }
                                    else {
                                        callback(null, result);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    };


    //TODO: Pending test
    var requestForDeAllocation = function (jsonDeAllocRequest, callback) {
        //de-allocate resources using cloudstack api and execute callback.
    };

    //TODO: Pending test
    var createServiceOffering = function (authorizedRequest, callback) {
        var requestingMemory = unitConverter.convertMemoryAndStorage(parseInt(authorizedRequest.requestContent.group[0].min_memory[0].size[0]), authorizedRequest.requestContent.group[0].min_memory[0].unit[0], 'mb');
        var requestingCores = parseInt(authorizedRequest.requestContent.group[0].cpu[0].cores[0]);
        var requestingFreq = unitConverter.convertFrequency(parseInt(authorizedRequest.requestContent.group[0].cpu[0].frequency[0]), authorizedRequest.requestContent.group[0].cpu[0].unit[0], 'mhz');

        var offeringName = 'ComputeOffering-' + authorizedRequest.session.userID + Date.now();

        cloudstack.execute('createServiceOffering', {
            displaytext: offeringName,
            name: offeringName,
            cpunumber: requestingCores,
            cpuspeed: requestingFreq,
            memory: requestingMemory,
            storagetype: 'shared'
        }, function (err, res) {
            callback(err, res);
        });
    };

    //TODO: Pending test
    var createDiskOffering = function (authorizedRequest, callback) {

        var type = authorizedRequest.requestContent.group[0].image[0].type[0];

        if(type == 'iso'){
            var requestingStorage = unitConverter.convertMemoryAndStorage(parseInt(authorizedRequest.requestContent.group[0].min_storage[0].primary[0]), authorizedRequest.requestContent.group[0].min_storage[0].unit[0], 'gb');
            var diskOfferingName = 'DiskOffering-' + authorizedRequest.session.userID + Date.now();

            cloudstack.execute('createDiskOffering', {
                displaytext: diskOfferingName,
                name: diskOfferingName,
                disksize: requestingStorage,
                storagetype: 'shared'
            }, function (err, res) {
                if(err){
                    callback(response.error(500, "Cloudstack Error!", err));
                }
                else{
                    callback(null, res);
                }
            });
        }
        else if(type == 'template'){
            callback(null);
        }
        else{
            callback(response.error(200, "Unsupported image format!", null));
        }

    };

    var registerVMTemplate = function (authorizedRequest, callback) {
        //TODO: register a template for VM here
    };

    var deployVM = function (selectedHost, authorizedRequest, serviceOfferingID, diskOfferingID, vmGroupID, callback) {
        var hostID = selectedHost.cloudstackID;
        var templateID = authorizedRequest.requestContent.group[0].image[0].id[0]; //TODO: template ID should be given through authorizedRequest

        //list all available zones, take the first zone's id and deploy vm there (zoneid is required when deploying a VM)
        cloudstack.execute('listZones', {available: true}, function (err, result) {
            if(err){
                callback(response.error(500, "Cloudstack error!", err));
            }
            else{
                var zoneID = result.listzonesresponse.zone[0].id;

                if(vmGroupID){
                    cloudstack.execute('deployVirtualMachine', {
                        serviceofferingid: serviceOfferingID,
                        templateid: templateID,
                        diskofferingid: diskOfferingID,
                        zoneid: zoneID,
                        group: vmGroupID,
                        hostid: hostID,
                        hypervisor: HYPERVISOR
                    }, function (err, res) {
                        if(err){
                            callback(response.error(500, 'Cloudstack error!', err));
                        }
                        else{
                            console.log("VM is being deployed !");
                            callback(null, res);
                        }
                    });
                }
                else{
                    cloudstack.execute('createInstanceGroup', {}, function (err, res) {
                        if(err){
                            callback(response.error(500, 'Cloudstack error!', err));
                        }
                        else{
                            cloudstack.execute('deployVirtualMachine', {
                                serviceofferingid: serviceOfferingID,
                                templateid: templateID,
                                diskofferingid: diskOfferingID,
                                zoneid: zoneID,
                                group: res.createinstancegroupresponse.instancegroup.id,
                                hostid: hostID
                            }, function (err, res) {
                                if(err){
                                    callback(response.error(500, 'Cloudstack error!', err));
                                }
                                else{
                                    callback(null, res);
                                }
                            });
                        }
                    });
                }
            }
        });

    };

    //TODO: Pending test
    var allocateRequest = function (selectedHost, authorizedRequest, callback) {
        var cloudstack = new (require('csclient'))({
            serverURL: CLOUDSTACK.API,
            apiKey: CLOUDSTACK.API_KEY,
            secretKey: CLOUDSTACK.SECRET_KEY
        });

        var thisAllocationId = (require('mongoose')).Types.ObjectId().toString();

        var DBHosts = require('../db/schemas/dbHost');

        cloudstack.execute('createInstanceGroup', {name: thisAllocationId}, function (err, result) {
            var vmGroupID = result.createinstancegroupresponse.instancegroup.id;
            if (err) {
                callback(response.error(500, 'Cloudstack error!', err));
            }
            else {
                createServiceOffering(authorizedRequest, function (err, result) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var serviceOfferingID = result.createserviceofferingresponse.serviceoffering.id;
                        createDiskOffering(authorizedRequest, function (err, result) {
                            if (err) {
                                callback(err);
                            }
                            else {
                                var diskOfferingID = result.creatediskofferingresponse.diskoffering.id;
                                deployVM(selectedHost, authorizedRequest, serviceOfferingID, diskOfferingID, vmGroupID, function (err, result) {
                                    if (err) {
                                        callback(err);
                                    }
                                    else {
                                        var allocation = new Allocation({
                                            _id: thisAllocationId,
                                            from: Date.now(),
                                            expires: null,
                                            userSession: authorizedRequest.session,
                                            allocationTimestamp: Date.now(),
                                            allocationPriority: authorizedRequest.requestContent.group[0].priority[0],
                                            associatedHosts: [selectedHost],
                                            vmGroupID: result.createvirtualmachineresponse.virtualmachine.group,
                                            allocationRequestContent: authorizedRequest.requestContent
                                        });

                                        allocation.save(function (err) {
                                            if (err) {
                                                cloudstack.execute('destroyVirtualMachine', {}, function (err, res) {
                                                    if(err){
                                                        callback(response.error(500, 'Cloudstack Error!', err));
                                                    }
                                                    else{
                                                        //if database error occured, destroy the created virtualmachine and return error
                                                        callback(response.error(500, 'Database Error!', err));
                                                    }
                                                });
                                            }
                                            else {
                                                callback(null, response.success(200, 'Resource allocation successful!', result));
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    };


    var findBestHost = function (filteredHostsInfo, authorizedRequest, callback) {

        var utilFunctions = require('../util/utilFunctions')();
        var getDBHostByZabbixId = utilFunctions.getDBHostByZabbixId;
        var getHostByZabbixId  = utilFunctions.getHostByZabbixId;
        var getItemValueByKey= utilFunctions.getItemValueByKey;

        if (filteredHostsInfo.length == 1) {
            //TODO: call getDBHostByZabbixId() here

            getDBHostByZabbixId(filteredHostsInfo[0].hostid, function (err, dbHost) {
                if(err){
                    callback(response.error(500, "Database Error !", err));
                }
                else{
                    callback(null, dbHost);
                }
            });

            callback(null, filteredHostsInfo[0]);
        }
        else {

            DBHost.find({}).exec(function (err, res) {
                var availableHostList = [];
                for(var i in res){
                    availableHostList.push(""+ res[i].zabbixID);
                }

                var minMemoryHostInfo = filteredHostsInfo[0];
                var filteredIndex = 0;
                while((availableHostList.indexOf(filteredHostsInfo[filteredIndex].hostId) == -1))    {
                    minMemoryHostInfo = filteredHostsInfo[++filteredIndex];
                }

                for (var i in filteredHostsInfo) {
                    if ((getItemValueByKey(filteredHostsInfo[i], 'vm.memory.size[available]') < getItemValueByKey(getHostByZabbixId(filteredHostsInfo, minMemoryHostInfo.hostId), 'vm.memory.size[available]')) && (availableHostList.indexOf(filteredHostsInfo[i].hostId) > -1)) {
                        minMemoryHostInfo = filteredHostsInfo[i];
                    }
                }


                getDBHostByZabbixId(minMemoryHostInfo.hostId, function (err, dbHost) {
                    if(err){
                        callback(response.error(500, "Database Error !", err));
                    }
                    else{
                        callback(null, dbHost);
                    }
                });

            });



        }


    };

    var findBestStorage = function (filteredStorageInfo) {
        //TODO: find best storage
    };

    return {
        requestForAllocation: requestForAllocation,
        requestForDeAllocation: requestForDeAllocation
    }


};
