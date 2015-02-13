module.exports = function(){

    var scheduleRequest = function(authorizedRequest, allPossibleHosts, callback){

        var Allocations = require('../db/schemas/dbAllocation');
        var responseMessage = require('../../config/responseMessages');
        var underscore = require('underscore');

        var migrationScheduler = new (require('./migrationScheduler'))();

        if(allPossibleHosts.length > 0){
            //migrationScheduler.findHostByMigration(authorizedRequest, allPossibleHosts, function(error, selectedHost){
            //
            //   if(error){
            //        callback(error);
            //   }
            //    else{
            //        if(selectedHost){
            //            callback(null, selectedHost);
            //        }
            //       else{

            var preemptiveScheduler = new (require('./preemptiveScheduler'))();

            preemptiveScheduler.findHostByPreemption(authorizedRequest, allPossibleHosts, function (err, selectedHost) {
                if(!err){
                    callback(null, selectedHost);
                }
                else{
                    //If no host was found either using migration scheduler or preemptive scheduler, just return result message to the vm scheduler.
                    callback(err);
                }
            });

            //       }
            //
            //    }
            //
            //});
        }
        else{
            callback(responseMessage.error(500, ERROR.NO_RESOURCES_TO_ALLOCATE));
        }

    };

    return {
        scheduleRequest: scheduleRequest
    }

};