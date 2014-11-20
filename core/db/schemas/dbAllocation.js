var mongoose = require('mongoose');

module.exports = mongoose.model('DBAllocation', {
    allocationID : Number,
    from: Date,
    to: Date,
    allocationID: Number,
    allocationTimestamp: Date,
    allocationPriority: Number,
    allocationRequestContent: Object
});
