
var mongoose = require('mongoose');
mongoose.connect('mongodb://virtualops_user:virtualops@ds053160.mongolab.com:53160/virtualops_db');

module.exports = mongoose.connection;