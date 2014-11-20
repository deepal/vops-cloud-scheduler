//Cloudstack configuration

CLOUDSTACK = {}
CLOUDSTACK.API = "http://localhost:8080/client/api?"
CLOUDSTACK.API_KEY = "tNuyVh4Kt1U2_6dJ9uyTvDy1G-MNZNRVq_OhIoFYARvzxI18hZnwrXceOf_Hz5CXSixvuIi4kfmSyS0EUf_IHA"
CLOUDSTACK.SECRET_KEY = "GyROCzIRovuO31v82vBmPFVcpwY2pbmtszzUwJeRr6NkbXi2ttKqiVTAXwjPQyXM3c75FX4m8ZCh0NW8Zxi6gA"
CLOUDSTACK.METHODS = {};


//Zabbix configuration

ZABBIX = {}
ZABBIX.API = "http://localhost/zabbix/api_jsonrpc.php"
ZABBIX.USERNAME = "Admin"
ZABBIX.PASSWORD = "zabbix";
ZABBIX.METHODS = {
    login: "user.login",
    history: "history.get",
    hostslist: "host.get",
    itemslist: "item.get"
};

//PriorityLevels
PRIORITY = {};

PRIORITY = {
    JOB: {
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
        BEST_EFFORT: 0
    },
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
