module.exports = function(zSession){

    var requestForAllocation = function(jsonAllocRequest, callback){

        var hostFilter = new (require('./hostFilter'))(jsonRequest);
        hostFilter.fetchCloudInfo(zSession, function(err, filteredHostInfo){

            if(filteredHostInfo.length == 0){
                var priorityScheduler = new (require('./priorityScheduler'))(jsonAllocRequest);
                /// do whatever you do with priority scheduler
            }
            else{
                // schedule allocation directly
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
