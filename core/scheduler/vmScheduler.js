module.exports = function (zSession) {
    var authService = require('../auth/authService')();
    var db = require('../db');
    var Allocation = require('../db/schemas/dbAllocation');
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
                        console.log("Selected Host: " + JSON.stringify(filteredHostsInfo[0]));
                        //findBestHost(filteredHostsInfo, authorizedRequest, function (err, bestHost) {
                        //    if(err){
                        //        callback(err);
                        //    }
                        //    else{
                        //        console.log(bestHost);
                        //    }
                        //});

                        allocateRequest(filteredHostsInfo[0], authorizedRequest, function (err, result) {
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

        var requestingStorage = unitConverter.convertMemoryAndStorage(parseInt(authorizedRequest.requestContent.group[0].min_storage[0].primary[0]), authorizedRequest.requestContent.group[0].min_storage[0].unit[0], 'gb');
        var diskOfferingName = 'DiskOffering-' + authorizedRequest.session.userID + Date.now();

        cloudstack.execute('createDiskOffering', {
            displaytext: diskOfferingName,
            name: diskOfferingName,
            disksize: requestingStorage,
            storagetype: 'shared'
        }, function (err, res) {
            callback(err, res);
        });

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
                        hostid: hostID
                    }, function (err, res) {
                        if(err){
                            callback(response.error(500, 'Cloudstack error!', err));
                        }
                        else{
                            callback(res);
                        }
                    });
                }
                else{
                    cloudstack.execute('createInstanceGroup', {

                    }, function (err, res) {
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
                                    callback(res);
                                }
                            });
                        }
                    })
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

        DBHosts.findOne({zabbixID: selectedHost.hostId}).exec(function (err, sHost) {
            if (err) {
                callback(response.error(500, 'Database Error!', err));
            }
            else {
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
                                        deployVM(sHost, authorizedRequest, serviceOfferingID, diskOfferingID, vmGroupID, function (err, result) {
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
                                                    associatedHosts: [sHost],
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
                                                        callback(response.success(200, 'Resource allocation successful!', result));
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
            }
        });
    };

    var findBestHost = function (filteredHostsInfo, authorizedRequest, callback) {

        var getValueByKey = function (hostInfo, key) {
            for (var i in hostInfo.items) {
                if (hostInfo.items[i].itemKey == key) {
                    return hostInfo.items[i].value;
                }
            }
            return false;
        };

        var getHostByZabbixId = function (filteredHosts, hostID) {
            for (var i in filteredHosts) {
                if (filteredHosts[i].hostId == hostID) {
                    return filteredHosts[i];
                }
            }
            return false;
        };

        var getDBHostByZabbixId = function (zabbixId, callback) {
            //TODO: take zabbix ID as a parameter and get the host from the database and return through callback
        };

        if (filteredHostsInfo.length == 1) {
            //TODO: call getDBHostByZabbixId() here
            callback(null, filteredHostsInfo[0]);
        }
        else {
            var bestHostZabbixID = null;
            var minMemoryHostInfo = filteredHostsInfo[0];
            var minCoresHostInfo = filteredHostsInfo[0];
            var minCPUFreqHostInfo = filteredHostsInfo[0];
            var minCPUUtilHostInfo = filteredHostsInfo[0].hostId;

            for (var i in filteredHostsInfo) {
                if (getValueByKey(filteredHostsInfo[i], 'vm.memory.size[available]') < getValueByKey(getHostByZabbixId(filteredHostsInfo, minMemoryHostInfo), 'vm.memory.size[available]')) {
                    minMemoryHostInfo = filteredHostsInfo[i];
                }
                if (getValueByKey(filteredHostsInfo[i], 'system.cpu.num') < getValueByKey(getHostByZabbixId(filteredHostsInfo, minCoresHostInfo), 'system.cpu.num')) {
                    minCoresHostInfo = filteredHostsInfo[i];
                }
                //TODO: need to do this for frequency as well
            }

            //TODO: compare these two hosts and select the most suitable considering whether the request is memory-intensive or cpu-intensive

            var requestingMemory = unitConverter.convertMemoryAndStorage(parseInt(authorizedRequest.requestContent.group[0].min_memory[0].size[0]), (authorizedRequest.requestContent.group[0].min_memory[0].unit[0]).toLowerCase(), 'b' );
            var requestingCores = parseInt(authorizedRequest.requestContent.group[0].cpu[0].cores[0]);
            var requestingCPUFreq = unitConverter.convertFrequency(parseFloat(authorizedRequest.requestContent.group[0].cpu[0].frequency[0]),(authorizedRequest.requestContent.group[0].cpu[0].unit[0]).toLowerCase(), 'hz');

            if(!requestingMemory){
                callback(response.error(403, "Unsupported unit for min_memory in resource request!"));
            }
            else{
                if(!requestingCPUFreq){
                    callback(response.error(403, "Unsupported unit for cpu frequency in resource request!"));
                }
                else{
                    console.log("mincoresZabbixId = " + minCoresHostInfo.hostId);
                    console.log("minmemoryZabbixId = " + minMemoryHostInfo.hostId);

                    //TODO: call getDBHostByZabbixId() here
                    callback(null, true);
                }
            }
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
