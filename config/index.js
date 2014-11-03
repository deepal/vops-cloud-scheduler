ZABBIX_API = "http://localhost/zabbix/api_jsonrpc.php";
CLOUDSTACK_API="http://localhost:8080/client/api?";

CLOUDSTACK_API_METHODS = {};

ZABBIX_API_METHODS = {
    login: "user.login",
    history: "history.get",
    hostslist: "host.get",
    itemslist: "item.get"
};