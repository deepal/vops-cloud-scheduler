module.exports = function (zSession) {
    var authService = require('../auth/authService')();
    var db = require('../db');
    var Allocation = require('../db/schemas/dbAllocation');
    var DBHost = require('../db/schemas/dbHost');
    var response = require('../../config/responseMessages');
    var unitConverter = require('../../core/util/unitConverter')();
    var cloudstackUtils = require('../util/cloudstackUtils')();

    var cloudstack = new (require('csclient'))({
        serverURL: CLOUDSTACK.API,
        apiKey: CLOUDSTACK.API_KEY,
        secretKey: CLOUDSTACK.SECRET_KEY
    });

    //TODO: Pending test
    var requestForAllocation = function (jsonAllocRequest, callback) {

        authService.authorizeResourceRequest(jsonAllocRequest, function (err, authorizedRequest) {  //Authenticate and authorize incoming request
            if (err) {
                callback(err);
            }
            else {
                //console.log(JSON.stringify(authorizedRequest));
                var hostFilter = new (require('./hostFilter'))(authorizedRequest.requestContent);
                hostFilter.fetchCloudInfo(zSession, function (err, filteredHostsInfo, allPossibleHosts) { //find available resources using host filter

                    if (filteredHostsInfo.length == 0) {        // if there seem to be no space in hosts to allocate the request, call priority scheduler
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
                        findBestHost(filteredHostsInfo, authorizedRequest, function (err, bestHost) {       //find the best host among available to allocate the request
                            if(err){
                                callback(err);
                            }
                            else{
                                allocateRequest(bestHost, authorizedRequest, function (err, result) {       //allocate request on the selected host
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

        cloudstack.execute('createServiceOffering', {       //create a service offering via Cloudstack API
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

        if(type == 'iso'){      //If template type is ISO, it is required to create a service offering
            var requestingStorage = unitConverter.convertMemoryAndStorage(parseInt(authorizedRequest.requestContent.group[0].min_storage[0].primary[0]), authorizedRequest.requestContent.group[0].min_storage[0].unit[0], 'gb');
            var diskOfferingName = 'DiskOffering-' + authorizedRequest.session.userID + Date.now();

            cloudstack.execute('createDiskOffering', {      //create service offering via Cloudstack API
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
        else if(type == 'template'){    //If template type is 'template', virtual disk can be directly attached. no need of a disk offering
            callback(null);
        }
        else{
            callback(response.error(200, "Unsupported image format!", null));
        }

    };

    var registerVMTemplate = function (authorizedRequest, callback) {
        //TODO: register a template for VM here
    };

    var deployVM = function (selectedHost, authorizedRequest, serviceOfferingID, diskOfferingID, vmGroupID, allocationID, callback) {
        var hostID = selectedHost.cloudstackID;
        var templateID = authorizedRequest.requestContent.group[0].image[0].id[0]; //TODO: template ID should be given through authorizedRequest

        //list all available zones, take the first zone's id and deploy vm there (zoneid is required when deploying a VM)
        cloudstack.execute('listZones', {available: true}, function (err, result) {     //list available zones to allocate VM
            if(err){
                callback(response.error(500, "Cloudstack error!", err));
            }
            else{
                var zoneID = result.listzonesresponse.zone[0].id;       //select the first zone among them to allocate VM
                if(vmGroupID){


                    var params = {
                        selectedHost : selectedHost,
                        authorizedRequest: authorizedRequest,
                        serviceOfferingID: serviceOfferingID,
                        diskOfferingID: diskOfferingID,
                        vmGroupID: vmGroupID,
                        allocationID: allocationID,
                        hostID: hostID,
                        templateID: templateID,
                        zoneID: zoneID
                    };

                    deployAndSaveInDB(params, function (err, res) {
                        if(err){
                            callback(err);
                        }
                        else{
                            callback(null, res);
                        }
                    });

                }
                else{
                    cloudstack.execute('createInstanceGroup', {}, function (err, res) {     //if no group specified, create a group, this is specially for the first VM of a group
                        if(err){
                            callback(response.error(500, 'Cloudstack error!', err));
                        }
                        else{
                            cloudstack.execute('deployVirtualMachine', {    //then deploy
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
                                    console.log("VM Deploy request is being processed\n" +
                                    "\tService offering ID - "+serviceOfferingID+"\n" +
                                    "\tTemplate ID - "+templateID+"\n" +
                                    "\tDisk Offering ID - "+diskOfferingID+"\n" +
                                    "\tZone ID - "+zoneID+"\n" +
                                    "\tVM Group ID - "+vmGroupID+"\n" +
                                    "\tHost ID - "+hostID+"\n" +
                                    "\tHypervisor - "+HYPERVISOR);
                                    callback(null, res);
                                }
                            });
                        }
                    });
                }
            }
        });

    };

    var deployAndSaveInDB = function (params, callback) {
        cloudstack.execute('deployVirtualMachine', {        //deploy vm via cloudstack api after saving allocation in the database
            serviceofferingid: params.serviceOfferingID,
            templateid: params.templateID,
            diskofferingid: params.diskOfferingID,
            zoneid: params.zoneID,
            group: params.vmGroupID,
            hostid: params.hostID,
            hypervisor: HYPERVISOR
        }, function (err, res) {
            if(err){
                callback(response.error(500, 'Cloudstack error!', err));        //if error occured in cloudstack, return the error through callback
            }
            else{

                console.log("VM Deploy request is being processed\n" +
                "\tService offering ID - "+params.serviceOfferingID+"\n" +
                "\tTemplate ID - "+params.templateID+"\n" +
                "\tDisk Offering ID - "+params.diskOfferingID+"\n" +
                "\tZone ID - "+params.zoneID+"\n" +
                "\tVM Group ID - "+params.vmGroupID+"\n" +
                "\tHost ID - "+params.hostID+"\n" +
                "\tHypervisor - "+HYPERVISOR);

                var jobID = res.deployvirtualmachineresponse.jobid;     // get the Asynchronous JobID of VM deploy. Job ID required to get the deployed VM's ID using queryAsyncJobResult API Method

                cloudstackUtils.queryAsyncJobResult(jobID, function (err, res) {
                    // queryAsyncJobResult method recursively check whether VM deployment is complete and if complete,
                    // get the jobresult object and collect information about the VM including id, memory, cpucores, cpufreq etc.
                    if(err){
                        console.log("Error occured while calling queryAsyncJobResult !\nError info: "+err);
                    }
                    else{
                        if(res.errorcode){
                            console.log(res);  //if an error code is returned, VM deployment has been failed, log the error.
                        }
                        else{
                            var VMId = virtualmachine.id;
                            var VMMemory = unitConverter.convertMemoryAndStorage(virtualmachine.memory,'mb', 'b');
                            var VMCores = virtualmachine.cpunumber;
                            var VMFreq = virtualmachine.cpuspeed;
                            var InstanceName = virtualmachine.instancename;

                            var allocation = new Allocation({           //create new resource allocation request model to save in the database
                                _id: params.allocationID,
                                VM: {
                                    VMID: VMId,
                                    InstanceName: InstanceName,
                                    HostID: params.hostID,
                                    GroupID: params.vmGroupID,
                                    Memory: VMMemory,
                                    CPUFreq : VMFreq,
                                    CPUCount: VMCores
                                },
                                RequestContent: {
                                    Content: null,//params.authorizedRequest.requestContent,
                                    Session: params.authorizedRequest.session
                                },
                                AllocationInfo: {
                                    From: Date.now(),
                                    To: null,
                                    TimeStamp: Date.now(),
                                    Priority: params.authorizedRequest.requestContent.group[0].priority[0]
                                }
                            });

                            allocation.save(function (err) {        //save allocation in database
                                if (err) {
                                    console.log("Error saving allocation in the database\nError Info: "+err);
                                }
                                else {
                                    callback(null, res);        //if deployVirtualMachine command completes without an error, return a response before saving in the database
                                }
                            });
                        }
                    }
                });


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

        var thisAllocationId = (require('mongoose')).Types.ObjectId().toString();   //create a allocation ID using an ObjectID
        var DBHosts = require('../db/schemas/dbHost');

        cloudstack.execute('createInstanceGroup', {name: thisAllocationId}, function (err, result) {
            var vmGroupID = result.createinstancegroupresponse.instancegroup.id;
            if (err) {
                callback(response.error(500, 'Cloudstack error!', err));
            }
            else {
                createServiceOffering(authorizedRequest, function (err, result) {   //create a srevice offering
                    if (err) {
                        callback(err);
                    }
                    else {
                        var serviceOfferingID = result.createserviceofferingresponse.serviceoffering.id;
                        createDiskOffering(authorizedRequest, function (err, result) {      //create a disk offering if needed
                            if (err) {
                                callback(err);
                            }
                            else {
                                var diskOfferingID = result.creatediskofferingresponse.diskoffering.id;
                                deployVM(selectedHost, authorizedRequest, serviceOfferingID, diskOfferingID, vmGroupID, thisAllocationId, function (err, result) { //deploy vm
                                    if (err) {
                                        callback(err);
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
    };


    var findBestHost = function (filteredHostsInfo, authorizedRequest, callback) {      //select the best host among the ones selected from the host filter

        var utilFunctions = require('../util/utilFunctions')();
        var getDBHostByZabbixId = utilFunctions.getDBHostByZabbixId;
        var getHostByZabbixId  = utilFunctions.getHostByZabbixId;
        var getItemValueByKey= utilFunctions.getItemValueByKey;

        if (filteredHostsInfo.length == 1) {
            //TODO: call getDBHostByZabbixId() here

            getDBHostByZabbixId(filteredHostsInfo[0].hostId, function (err, dbHost) {   //to query database using zabbix host id
                if(err){
                    callback(response.error(500, "Database Error !", err));
                }
                else{
                    console.log("Selected Host : "+ dbHost.ipAddress);
                    callback(null, dbHost);
                }
            });

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
                        console.log("Selected Host : "+ dbHost.ipAddress);
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
