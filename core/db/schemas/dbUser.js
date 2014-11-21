var mongoose = require('mongoose');

module.exports = mongoose.model('DBUser', {
    username: String,
    password: String,
    priority: Number
});