
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/virtualops_db');

module.exports = mongoose.connection;