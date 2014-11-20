var mongoose = require('mongoose');

module.exports = mongoose.model('DBQueuedRequest', {
    requestID: Number,
    timeStamp: Date,
    userID: Number,
    request: Object
});