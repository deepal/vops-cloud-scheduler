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
//listHosts();
//createServiceOffering('MyOffering','myoffering', 1, 1000, 2048, true);
//listServiceOfferings();
listVirtualMachines();
//listZones();
//findHostsForMigration();
//createVMSnapshot();

//deployVM();