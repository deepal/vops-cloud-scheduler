var mongoose = require('mongoose');

module.exports = mongoose.model('DBSession', {
    username: String,
    sessionID: String,
    userPriority: Number,
    admin: Boolean
});