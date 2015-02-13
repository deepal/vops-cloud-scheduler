var mongoose = require('mongoose');

module.exports = mongoose.model('DBPreemptedJob', {
    jobPriority: Number,
    preemptionTimestamp: Date,
    jobContent: Object
});