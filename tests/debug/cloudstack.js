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
            console.log(result);
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
        serviceofferingid: "8cf0a8a1-418b-4654-8ac3-778c7314e546",
        templateid:        "280b40d0-6644-4e47-ac7c-074e2fa40cd4",
        zoneid:            "c7b79e90-9478-45b9-800f-8fc69033c5ee",
        diskofferingid:    "180b32b2-a5e7-48f9-880e-a0c920d2c3f1",
        hypervisor: "KVM",
        displayname: "slitz",
        name: "slitz"
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


//listHosts();
//createServiceOffering('MyOffering','myoffering', 1, 1000, 2048, true);
//listServiceOfferings();
//listVirtualMachines();
//listZones();
deployVM();