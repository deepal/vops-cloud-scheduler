//API information
ZABBIX_API = "http://localhost/zabbix/api_jsonrpc.php";
CLOUDSTACK_API="http://localhost:8080/client/api?";

//authentication information
CLOUDSTACK_API_SECRET_KEY = "";
CLOUDSTACK_API_KEY = "";
ZABBIX_USERNAME = "Admin"
ZABBIX_PASSWORD = "zabbix";

//API method reference
CLOUDSTACK_API_METHODS = {};

ZABBIX_API_METHODS = {
    login: "user.login",
    history: "history.get",
    hostslist: "host.get",
    itemslist: "item.get"
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
