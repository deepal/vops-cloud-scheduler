var mongoose = require('mongoose');

module.exports = mongoose.model({
    zabbixItemID: Number,
    ewma_last: Double
});