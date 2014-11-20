module.exports = function(){

    /*
    priority scheduler is called when there are no hosts with enough resources to allocate the coming request
    Constructor of priority scheduler accepts two parameters, first one is 'jsonAllocRequest' which is the resource allocation request
    sent by the user via API and the second one is a callback function which is to give a response to the user.
     */

    var scheduleRequest = function(jsonAllocRequest, callback){
        /*
        1. Call the 'MigrationScheduler' and check whether it is possible to migrate some VMs from a particular host( obviously
        has enough total CPU, Memory, Number of cores to handle incoming request) and gain space on that host such that
        the resource request can be allocated there.
        */

        var migrationScheduler = new (require('./migrationScheduler'))();

        migrationScheduler.findHostByMigration(jsonAllocRequest, function(result, selectedHost){

            if(result.status == 'success'){
                // if result.status is 'success', value returned for 'selectedHost' is the HOST information of the host selected by migration scheduler

                result.scheduler = "migration_scheduler";

                callback(result, selectedHost);

            }
            else{
                 //If result.status is 'error', no host could be selected for this request to be allocated by migrating its VMs to other hosts. Time to go for preemptive scheduling..
                //TODO: Retrieve current allocations from the database and check whether current request has higher priority than any of the current allocations
                //TODO: Also check whether if lower priority VMs were unallocated, significant resource space can be gained to schedule the new request. Otherwise there's no point of preempting VMs unnecessarily

                var preemptiveScheduler = new (require('./preemptiveScheduler'))();

                preemptiveScheduler.findHostByPreemption(jsonAllocRequest, function (result, selectedHost) {
                    if(result.status == 'success'){
                        /*
                         if result.status is 'success', value returned for 'selectedHost' is the HOST information
                         of the host selected by preemption scheduler
                         */
                        result.scheduler = "preemptive_scheduler";
                        callback(result, selectedHost);
                    }
                    else{
                        //If no host was found either using migration scheduler or preemptive scheduler, just return result message to the vm scheduler.
                        callback(result);
                    }
                });
            }

        });

        /*
        2. If migration is not possible (if such host is not found), invoke 'Preemptive Scheduler' and pass the 'jsonAllocRequest'
        to preemptive scheduler
         */
    }

    return {
        scheduleRequest: scheduleRequest
    }

}