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
        serviceofferingid: "edb7dc1e-aba6-4e50-895e-828d34546629",
        templateid:        "df6b9d45-92d0-11e4-aeda-94de80298dcc",
        zoneid:            "b466a214-880d-4a4a-88b1-1c03fe2a36c7",
        diskofferingid:    "39382d71-d617-4601-86a7-58c45c5fea50",
        hypervisor: "KVM",
        displayname: "centos",
        name: "centos"
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


listHosts();
//createServiceOffering('MyOffering','myoffering', 1, 1000, 2048, true);
//listServiceOfferings();
//listVirtualMachines();
//listZones();

//deployVM();