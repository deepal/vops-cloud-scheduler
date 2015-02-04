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
        serviceofferingid: "4b022f62-66a5-41c7-9cf2-f34c797e9949",
        templateid:        "cd9ec1b6-19d2-40a9-9dda-ccde05e79f5a",
        zoneid:            "ece275c0-5581-4192-a6b5-7c2fe477ed4b",
        diskofferingid:    "0691c1a6-8184-4ba3-b527-bd28ea35bccc",
        hypervisor: "kvm",
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