
//Resource Scheduler Configuration
LISTEN_PORT = 3000;
HYPERVISOR = 'kvm'

//Cloudstack configuration

CLOUDSTACK = {};
CLOUDSTACK.API = "http://10.8.100.201:8080/client/api?";
CLOUDSTACK.API_KEY = "bANrrQkvIZhxoyS_HLIc-4V985FXY9oQ7BnyWC9bzSCoQbBND4QiHgZVs7wzRWFFvI5CKasauQubk8Fwiz2Rig";
CLOUDSTACK.SECRET_KEY = "2BRkxHmqZU3lSVIsRT6iw491835xk1b9w9FbpNxXkwpYULMXAM6_UBPBUFpiNPA3z77jQc6H55sd-HurKRl-vQ";
CLOUDSTACK.METHODS = {};

//MongoDB configuration

MONGO = {};
MONGO.HOST = "10.8.106.208";

//Zabbix configuration

ZABBIX = {};
ZABBIX.API = "http://10.8.106.208/zabbix/api_jsonrpc.php";
ZABBIX.USERNAME = "Admin";
ZABBIX.PASSWORD = "vops.zabbix";
ZABBIX.METHODS = {
    login: "user.login",
    history: "history.get",
    hostslist: "host.get",
    itemslist: "item.get"
};
ZABBIX.SELECTED_ITEM_ATTR = ['vm.memory.size[available]', 'system.cpu.load', 'system.cpu.util','vm.memory.size[total]', 'system.cpu.num', 'system.hw.cpu[0, maxfreq]'];

//PriorityLevels
PRIORITY = {};
PRIORITY = {};
PRIORITY.JOB = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    BEST_EFFORT: 0
};

PRIORITY = {
    USER: {
        HIGH: {
            value: 3,
            maxJobPriority: [
                PRIORITY.JOB.HIGH,
                PRIORITY.JOB.MEDIUM,
                PRIORITY.JOB.LOW,
                PRIORITY.JOB.BEST_EFFORT
            ]
        },
        MEDIUM: {
            value: 2,
            maxJobPriority: [
                PRIORITY.JOB.MEDIUM,
                PRIORITY.JOB.LOW,
                PRIORITY.JOB.BEST_EFFORT
            ]
        },
        LOW: {
            value: 1,
            maxJobPriority: [
                PRIORITY.JOB.LOW,
                PRIORITY.JOB.BEST_EFFORT
            ]
        }
    }
};



