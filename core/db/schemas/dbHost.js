var mongoose = require('mongoose');

module.exports = mongoose.model('DBHosts', {
    id: Number,
    zabbixID: Number,
    cloudstackID: Number,
    ipAddress: String
});