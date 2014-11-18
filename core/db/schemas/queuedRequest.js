var mongoose = require('mongoose');

module.exports = mongoose.model('QueuedRequest', {
    id: Number,
    timeStamp: String,
    userID: Number,
    request: Object
});