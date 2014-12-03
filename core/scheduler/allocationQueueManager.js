module.exports = function(){

    var db = require('../db');
    var QueuedRequests = require('../db/schemas/dbQueuedRequest');
    var response = require('../../config/responseMessages');
    var fetchedRequest;

    var queueRequest = function (authorizedRequest, callback) {
        var request = new QueuedRequests({
            timestamp: Date.now(),
            userID: authorizedRequest.session.userID,
            requestPriority: authorizedRequest.requestContent.priority,
            request: authorizedRequest.requestContent
        });
        request.save(function (err) {
            if(err){
                callback(response.error(500, 'Internal Server Error!', err));
            }
            else{
                callback(null, response.success('200', 'Request was queued') );
            }
        });
    }

    var fetchQueuedRequest = function (callback) {
        //fetch the request with highest priority
        QueuedRequests.find().sort('-requestPriority').exec(function (err, queuedRequests) {
            if(!err) {
                fetchedRequest = queuedRequests[0];
                QueuedRequests.find({_id:fetchedRequest._id}).remove(function (err) {
                  if(!err){
                      callback(null, fetchedRequest);
                  }
                    else{
                      callback(response.error(500, 'Database connection error!', err));
                  }
                });

            }
            else{
                callback(response.error(500, 'Database connection error!', err));
            }
        });
    };

    var trigger = function(callback){
        fetchQueuedRequest(function(err, fetchedRequest){
            if(err){
                callback(err);
            }
            else{
                callback(null, fetchedRequest);
            }
        });
    };

    return {
        queueRequest: queueRequest,
        trigger: trigger
    }
};