var db = require('../../core/db');
var QueuedRequests = require('../../core/db/schemas/dbQueuedRequest');

for(var i=1; i<10; i++){
    var newRequest = new QueuedRequests({
        timeStamp: Date.now(),
        userID: i,
        requestPriority: Math.floor((Math.random() * 3) + 1),
        request: {
            sessionID: (require('mongoose')).Types.ObjectId().toString(),
            requestContent: {}
        }
    });
    newRequest.save(function (err) {
        if(err){
            throw err;
        }
    });
}
