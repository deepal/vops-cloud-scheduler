module.exports = function(){

    /*
    priority scheduler is called when there are no hosts with enough resources to allocate the coming request
    Constructor of priority scheduler accepts two parameters, first one is 'jsonAllocRequest' which is the resource allocation request
    sent by the user via API and the second one is a callback function which is to give a response to the user.
     */

    var scheduleRequest = function(jsonAllocRequest, callback){

        var Allocations = require('../db/schemas/dbAllocation');
        var responseMessage = require('../../config/responseMessages');
        /*1. Call the 'MigrationScheduler' and check whether it is possible to migrate some VMs from a particular host( obviously
        has enough total CPU, Memory, Number of cores to handle incoming request) and gain space on that host such that
        the resource request can be allocated there.*/

        var migrationScheduler = new (require('./migrationScheduler'))();

        migrationScheduler.findHostByMigration(jsonAllocRequest, function(error, selectedHost){

            if(!error){
                callback(null, selectedHost);
            }
            else{
                Allocations.find({
                    allocationPriority: {
                        $lt: jsonAllocRequest.requestContent.priority
                    }
                }).exec(function (err, allocations) {
                    if(err){
                        callback(responseMessage.error(500, 'Internal Server Error', err));
                    }
                    else{
                        if(allocations){
                            if(allocations.length){
                                //there are allocation with less priority than the coming, they can be preempted if useful
                                var candidates = null; //should be equal to the array of most suitable hosts which can be freed by suspending VMs

                                var preemptiveScheduler = new (require('./preemptiveScheduler'))();

                                preemptiveScheduler.findHostByPreemption(jsonAllocRequest, candidates, function (result, selectedHost) {
                                    if(result.status == 'success'){
                                        /*
                                         if result.status is 'success', value returned for 'selectedHost' is the HOST information
                                         of the host selected by preemption scheduler
                                         */
                                        result.scheduler = "preemptive_scheduler";
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

        });

    }

    return {
        scheduleRequest: scheduleRequest
    }

}