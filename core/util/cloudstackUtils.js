module.exports = function () {

    var queryAsyncJobResultRecurs = function (jobid, callback) {
        cloudstack.execute('queryAsyncJobResult', {jobid:jobid}, function (err, result) {
            if (err) {
                callback(err);
            }
            else {
                if(result.queryasyncjobresultresponse.jobresult){
                    callback(null, result.queryasyncjobresultresponse.jobresult);
                }
                else{
                    queryAsyncJobResultRecurs(jobid, callback);
                }
            }
        });
    };

    return {
        queryAsyncJobResult: queryAsyncJobResultRecurs
    }

};