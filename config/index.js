
APP_NAME = "Smart Cloud Scheduler";
//Resource Scheduler Configuration
LISTEN_PORT = 3000;
HYPERVISOR = 'kvm';
SERVICES = {
    PREEMPTION_SERVICE_URL: 'http://localhost:8080/preempt'
};

ERROR = {
    DB_CONNECTION_ERROR : 'Database Error !',
    CLOUDSTACK_ERROR: 'CloudStack Error !',
    IO_ERROR: 'Error in file I/O !',
    HTTP_ERROR: 'Internal HTTP Error !',
    UNKNOWN_ERROR: 'An Unknown Error occured! May be due to an unknown response from JVirsh Service!',
    NO_RESOURCES_TO_ALLOCATE: 'No enough resource to serve your request at this moment !',
    JVIRSH_SERVICE_ERROR: 'Error communicating with JVirsh Preemption Web Service',
    INTERNAL_JVIRSH_ERROR: 'Internal Error occured in JVirsh',
    NOT_LOGGED_IN: 'You are not logged in !',
    REST_CLIENT_ERROR: 'Error occured calling an external REST API!',
    REQUEST_PRIORITY_NOT_AUTHORIZED: 'You have no previleges to specify this priority level for the request',
    REQUEST_QUEUED: 'Your request cannot be currently served due to insufficient resources! It has been queued and will be served later',
    SESSION_KEY_MISSING_IN_REQUEST: 'Authentication failed! Session ID is missing in the request',
    CUSTOM_ERROR: function(errText){
        return 'Unidentified Error! Error message : '+errText;
    }
};

SUCCESS = {
    HOST_REPOPULATED: 'All Hosts repopulated in database !'
};

//Cloudstack configuration

CLOUDSTACK = {};
CLOUDSTACK.API = "http://10.8.100.201:8080/client/api?";
CLOUDSTACK.API_KEY = "bANrrQkvIZhxoyS_HLIc-4V985FXY9oQ7BnyWC9bzSCoQbBND4QiHgZVs7wzRWFFvI5CKasauQubk8Fwiz2Rig";
CLOUDSTACK.SECRET_KEY = "2BRkxHmqZU3lSVIsRT6iw491835xk1b9w9FbpNxXkwpYULMXAM6_UBPBUFpiNPA3z77jQc6H55sd-HurKRl-vQ";
CLOUDSTACK.METHODS = {
    LIST_VMS: 'listVirtualMachines',
    LIST_HOSTS: '',
    LIST_ZONES: 'listZones',
    LIST_SERVICE_OFFERINGS: 'listServiceOfferings',
    DEPLOY_VM: 'deployVirtualMachine',
    DESTROY_VM: 'destroyVirtualMachine',
    CREATE_VM_GROUP: 'createInstanceGroup',
    CREATE_SERVICE_OFFERING: '',
    CREATE_DISK_OFFERING: '',
    QUERY_ASYNC_JOB_RESULT : 'queryAsyncJobResult',
    STOP_VM : 'stopVirtualMachine',
    CREATE_TEMPLATE : 'createTemplate'
};

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



