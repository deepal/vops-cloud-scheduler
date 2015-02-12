require('../../config');
var restClient = require('node-rest-client').Client;
var client = new restClient();

var cloudstack = new (require('csclient'))({
    serverURL: CLOUDSTACK.API,
    apiKey: CLOUDSTACK.API_KEY,
    secretKey: CLOUDSTACK.SECRET_KEY
});

var getValueForCSConfigKey = function (listconfigurationsresponse, key) {
    var config = listconfigurationsresponse.configuration;
    for (var i in config) {
        if (config[i].name == key) {
            return config[i].value;
        }
    }
    return false;
};

var createServiceOffering = function (displayText, name, cpuCount, cpuSpeed, memory, offerHA) {
    cloudstack.execute('createServiceOffering', {
        displaytext: displayText,
        name: name,
        cpunumber: cpuCount,
        cpuspeed: cpuSpeed,
        memory: memory,
        offerha: offerHA
    }, function (err, result) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(JSON.stringify(result));
        }
    });
};

var createInstanceGroup = function () {
    cloudstack.execute('createInstanceGroup', {
        name: (require('mongoose')).Types.ObjectId().toString()
    }, function (err, result) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(JSON.stringify(result));
        }
    });
};

var listServiceOfferings = function(id){

    cloudstack.execute('listServiceOfferings', {id: id}, function (err, result) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(JSON.stringify(result));
            var serviceOfferings = result.listserviceofferingsresponse.serviceoffering;
            for (var i = 0; i < serviceOfferings.length; i++) {
                console.log('----------------' + serviceOfferings[i].name + '-----------------');
                console.log('ID\t\t\t\t: '+serviceOfferings[i].id);
                console.log('# of Cores\t\t: ' + serviceOfferings[i].cpunumber);
                console.log('CPU Frequency\t: ' + serviceOfferings[i].cpuspeed + 'MHz');
                console.log('Memory\t\t\t: ' + serviceOfferings[i].memory + 'MB');
                console.log('Offer HA\t\t: ' + serviceOfferings[i].offerha+'\n\n');
            }
        }
    });
};

var listVirtualMachines = function () {
    cloudstack.execute('listVirtualMachines', {}, function (err, result) {
        if(err){
            console.log(err);
        }
        else{
            console.log(JSON.stringify(result));
        }
    });
};

var listServiceOfferings = function () {
    cloudstack.execute('listServiceOfferings', {}, function (err, result) {
        if(err){
            console.log(err);
        }
        else{
            console.log(JSON.stringify(result));
        }
    });
};

var listDiskOfferings = function () {
    cloudstack.execute('listDiskOfferings', {}, function (err, result) {
        if(err){
            console.log(err);
        }
        else{
            console.log(JSON.stringify(result));
        }
    });
};

var listZones = function () {
    cloudstack.execute('createInstanceGroup', {name: 'MyFirstInstanceGroup'}, function (err, result) {
        if(err){
            console.log(err);
        }
        else{
            console.log(JSON.stringify(result));
        }
    });
};

var login = function () {
    cloudstack.execute('login', {username: 'admin', password: 'password'}, function (err, result) {
        if(err){
            console.log(err);
        }
        else{
            console.log(JSON.stringify(result));
        }
    });
};

var deployVM = function () {

    cloudstack.execute('deployVirtualMachine', {
        response: 'json',
        serviceofferingid: "0a66a60e-42a7-420b-8352-1e506b782b1b",
        templateid:        "33e879c7-0cd6-40d6-803a-e1f03495e4e6",
        zoneid:            "f2b8ec40-938b-4e50-8dc8-7b3514f646c1",
        diskofferingid:    "1c7546f7-1897-4c2e-bbf9-4f9de2507050",
        hypervisor: "kvm"
    }, function (err, result) {
        if(err){
            console.log(err);
        }
        else{
            console.log(JSON.stringify(result));
        }
    });

};

var deployVMInHost = function (hostid, callback) {

    cloudstack.execute('deployVirtualMachine', {
        response: 'json',
        serviceofferingid: "cd4148a1-e492-4b5d-9665-2061958d84b8",
        templateid:        "33e879c7-0cd6-40d6-803a-e1f03495e4e6",
        zoneid:            "f2b8ec40-938b-4e50-8dc8-7b3514f646c1",
        diskofferingid:    "1c7546f7-1897-4c2e-bbf9-4f9de2507050",
        hostid:            hostid,
        hypervisor: "kvm"
    }, function (err, result) {
        if(err){
            callback(err);
        }
        else{
            callback(null, result);
        }
    });

};


var listHosts = function () {
    cloudstack.execute('listHosts', {}, function (err, result) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(JSON.stringify(result));
        }
    });
};

var findHostsForMigration = function () {
    cloudstack.execute('findHostsForMigration', {virtualmachineid:'7734de0b-109a-4967-8cb8-89f435873385'}, function (err, result) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(JSON.stringify(result));
        }
    });
};

var createVMSnapshot = function () {
    cloudstack.execute('createVMSnapshot', {virtualmachineid:'54ed65e4-629f-42fc-b984-eaea998723e1'}, function (err, result) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(JSON.stringify(result));
        }
    });
};

var queryAsyncJobResultRecurs = function (jobid, callback) {
    cloudstack.execute('queryAsyncJobResult', {jobid:jobid}, function (err, result) {
        if (err) {
            callback(err);
        }
        else {
            if(result.queryasyncjobresultresponse.jobresult){
                callback(null, result.queryasyncjobresultresponse.jobresult);
            }
            else{
                queryAsyncJobResultRecurs(jobid, callback);
            }
        }
    });
};

//listHosts();
//createServiceOffering('MyOffering','myoffering', 1, 1000, 2048, true);
//listServiceOfferings();
//listVirtualMachines();
//listZones();
//findHostsForMigration();
//createVMSnapshot();

//deployVM();

//h4    -   f0a10e72-2e17-4d16-bf45-767ba486d4e4
//h3    -   fd0a9107-27e3-495e-94c8-412c5879611d
//h2    -   e38f982f-5fd6-4548-898c-de9450447fde

deployVMInHost("e38f982f-5fd6-4548-898c-de9450447fde", function (err, result) {
    var jobID = result.deployvirtualmachineresponse.jobid;
    queryAsyncJobResultRecurs(jobID, function (err, result) {
        if(err){
            throw  err;
        }
        else{
            if(result.errorcode){
                console.log("[!] "+result.errortext);
            }
            console.log(JSON.stringify(result));
        }
    })
});

//queryAsyncJobResultRecurs("89e65a39-5b11-408b-970f-b235b53df580", false, function (err, result) {
//    if(err){
//        throw  err;
//    }
//    else{
//        console.log(JSON.stringify(result));
//    }
//});
//deployVM();