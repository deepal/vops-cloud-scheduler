var mongoose = require('mongoose');

module.exports = mongoose.model('DBHosts', {
    zabbixID: Number,
    cloudstackID: Number,
    ipAddress: String
});