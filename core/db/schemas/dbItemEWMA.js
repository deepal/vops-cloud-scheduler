var mongoose = require('mongoose');

module.exports = mongoose.model('DBEwma', {
    zabbixItemID: Number,
    ewma_last: Number
});