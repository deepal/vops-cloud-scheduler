var mongoose = require('mongoose');

module.exports = mongoose.model('DBSession', {
    _id: ObjectId,
    username: String,
    sessionID: String,
    userPriority: Number,
    admin: Boolean
});