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