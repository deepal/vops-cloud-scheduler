require('../../config');
var mongoose = require('mongoose');
mongoose.connect('mongodb://'+MONGO.HOST+'/virtualops_db');

module.exports = mongoose.connection;