//Cloudstack configuration

CLOUDSTACK = {};
CLOUDSTACK.API = "http://10.8.106.208:8080/client/api?";
CLOUDSTACK.API_KEY = "gQQEJNh_5v6pgohQG_xYPTHRgRyXUvqoaZMmxZXkdDFZxpp4_XaWzvwtFGIPz58Hf5Lkfbu8jZ09xIkcnNSVYw";
CLOUDSTACK.SECRET_KEY = "szcpwWvdRp48ExEloj2V3E3rjaQfCO-Cqt69f1q-VTWtqVyKAZHd4Ajn9Fo6IDN2kPb0gpkOmzElikooKj41Pw";
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
ZABBIX.SELECTED_ITEM_ATTR = ['vm.memory.size[available]', 'system.cpu.load', 'system.cpu.util','vm.memory.size[total]', 'system.cpu.num', 'system.hw.cpu'];

//PriorityLevels
PRIORITY = {};
PRIORITY = {};
PRIORITY.JOB = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    BEST_EFFORT: 0
}

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



//Resource allocation attributes
ATTRS = [
    {
        attr:"vm_count",
        name: "VM Count",
        fields:[
            "Value"
        ]
    },

    {
        attr:"os",
        name: "OS",
        fields:["name","version"]
    },
    {
        attr:"cpu",
        name: "CPU",
        fields:["Architecture","Frequency","Cores","Unit"]
    },
    {
        attr:"min_memory",
        name: "Min Memory",
        fields:["Value","Unit"]
    },
    {
        attr:"storage",
        name: "Storage",
        fields:["Value","Unit"]
    },
    {
        attr:"network",
        name: "Network",
        fields:["Min. Bandwidth","Unit"]
    },
    {
        attr:"priority",
        name: "Priority",
        fields:["Value"]
    },
    {
        attr:"hpc",
        name: "HPC info",
        fields:["Required"]
    },
    {
        attr:"allocation_time",
        name: "Allocation Time",
        fields:["From","to"]
    }
]
