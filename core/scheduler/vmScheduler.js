module.exports = function(zSession){

    var requestForAllocation = function(jsonAllocRequest, callback){

        console.log(jsonAllocRequest);

        var authService = require('../auth/authService')();
        var response = require('../../config/responseMessages');

        authService.authorizeResourceRequest(jsonAllocRequest, function(err, authorizedRequest){
            if(err){
                callback(response.error(500, 'Internal Server Error!', err));
            }
            else{
                var hostFilter = new (require('./hostFilter'))(authorizedRequest.requestContent);
                hostFilter.fetchCloudInfo(zSession, function(err, filteredHostInfo){

                    if(filteredHostInfo.length == 0){
                        var priorityScheduler = new (require('./priorityScheduler'))();
                        /// do whatever you do with priority scheduler
                        priorityScheduler.scheduleRequest(authorizedRequest, function(err, selectedHost){
                            // results returned from migration scheduler or preemptive scheduler
                            if(!err){
                                //allocate resources for the request in the 'selectedHost'. Then call 'callback' function.
                                //in the callback function, specify the job id for the allocation
                            }
                            else{
                                callback(err);
                            }
                        });
                    }
                    else{
                        // select the host with minimum resources and create VMs there using cloudstack module.
                    }
                });
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
