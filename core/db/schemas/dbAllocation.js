var mongoose = require('mongoose');

module.exports = mongoose.model('DBAllocation', {
    from: Date,
    expires: Date,
    userSession: Object,
    allocationTimestamp: Date,
    allocationPriority: Number,
    associatedHosts: Array,
    vmGroupID: Number,
    allocationRequestContent: Object
});
