var mongoose = require('mongoose');

module.exports = mongoose.model('DBSession', {
    userID: Object,
    username: String,
    sessionID: String,
    userPriority: Number,
    admin: Boolean
});