module.exports = function(zSession){

    var requestForAllocation = function(jsonAllocRequest, callback){

        var hostFilter = new (require('./hostFilter'))(jsonRequest);
        hostFilter.fetchCloudInfo(zSession, function(err, filteredHostInfo){

            if(filteredHostInfo.length == 0){
                var priorityScheduler = new (require('./priorityScheduler'))();
                /// do whatever you do with priority scheduler
                priorityScheduler.scheduleRequest(jsonAllocRequest, function(result, selectedHost){
                    // results returned from migration scheduler or preemptive scheduler
                    if(result.status == 'success'){
                        //allocate resources for the request in the 'selectedHost'. Then call 'callback' function.
                        //in the callback function, specify the job id for the allocation
                    }
                    else{
                        callback("Error", "Not enough resources to serve your resource request");
                    }
                });
            }
            else{
                // select the host with minimum resources and create VMs there using cloudstack module.
            }

        });

    }

    var requestForDeAllocation = function (jsonDeAllocRequest, callback) {
        //de-allocate resources using cloudstack api and execute callback.
    }

    return {
        requestForAllocation: requestForAllocation,
        requestForDeAllocation: requestForDeAllocation
    }


}
