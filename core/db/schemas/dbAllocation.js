var mongoose = require('mongoose');

module.exports = mongoose.model('DBAllocation', {
    VM: {
        VMID: String,
        InstanceName: String,
        HostInfo: Object,
        GroupID: String,
        Memory: Number,
        CPUFreq : Number,
        CPUCount: Number
    },
    RequestContent: {
        Content: Object,
        Session: Object
    },
    AllocationInfo: {
        From: Date,
        To: Date,
        TimeStamp: Date,
        Priority: Number
    }
});
