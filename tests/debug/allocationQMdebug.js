var aqm = new (require('../../core/scheduler/allocationQueueManager'))();

aqm.trigger(function(err, fetchedRequest){
    if(!err) {
        console.log(fetchedRequest);
    }
    else{
        throw err;
    }
});


