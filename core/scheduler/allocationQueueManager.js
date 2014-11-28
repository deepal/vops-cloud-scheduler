module.exports = function(){

    var db = require('../db');
    var QueuedRequests = require('../db/schemas/dbQueuedRequest');
    var response = require('../../config/responseMessages');

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

    var fetchQueuedRequest = function () {
        //fetch the request with highest priority
    }
    
    var trigger = function(){

    }

    return {
        queueRequest: queueRequest,
        trigger: trigger
    }
}