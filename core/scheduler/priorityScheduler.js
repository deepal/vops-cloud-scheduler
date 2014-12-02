module.exports = function(){

    var scheduleRequest = function(authorizedRequest, callback){

        var Allocations = require('../db/schemas/dbAllocation');
        var responseMessage = require('../../config/responseMessages');
        var underscore = require('underscore');

        var migrationScheduler = new (require('./migrationScheduler'))();

        migrationScheduler.findHostByMigration(authorizedRequest, function(error, selectedHost){

            if(error){
                callback(error);
            }
            else{
                if(selectedHost){
                    callback(null, selectedHost);
                }
                else{
                    Allocations.find({
                        allocationPriority: {
                            $lt: authorizedRequest.requestContent.priority
                        }
                    }).exec(function (err, allocations) {
                        if(err){
                            callback(responseMessage.error(500, 'Internal Server Error', err));
                        }
                        else{
                            if(allocations){
                                if(allocations.length){
                                    //there are allocation with less priority than the coming, they can be preempted if useful
                                    var candidates = []; //should be equal to the array of most suitable hosts which can be freed by suspending VMs

                                    for(var i in allocations){
                                        candidates = underscore.union(candidates, allocations[i].associatedHosts);
                                    }

                                    var preemptiveScheduler = new (require('./preemptiveScheduler'))();

                                    preemptiveScheduler.findHostByPreemption(authorizedRequest, candidates, function (err, selectedHost) {
                                        if(!err){
                                            callback(null, selectedHost);
                                        }
                                        else{
                                            //If no host was found either using migration scheduler or preemptive scheduler, just return result message to the vm scheduler.
                                            callback(responseMessage.error('200','No enough resource to serve your request at this moment !'));
                                        }
                                    });
                                }
                                else{
                                    callback(responseMessage.error('200','No enough resource to serve your request at this moment !'));
                                }
                            }
                            else{
                                callback(responseMessage.error(200, 'Database returned none'));
                            }
                        }
                    });
                }

            }

        });

    }

    return {
        scheduleRequest: scheduleRequest
    }

}