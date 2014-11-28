var mongoose = require('mongoose');

module.exports = mongoose.model('DBQueuedRequest', {
    timeStamp: Date,
    userID: Number,
    requestPriority: Number,
    request: Object
});