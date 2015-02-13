var mongoose = require('mongoose');

module.exports = mongoose.model('DBQueuedRequest', {
    timeStamp: Date,
    userSession: Object,
    requestPriority: Number,
    request: Object
});