var mongoose = require('mongoose');

module.exports = mongoose.model('DBPreemptedJob', {
    jobID: Number,
    jobPriority: Number,
    preemptionTimestamp: Date,
    jobContent: Object
});