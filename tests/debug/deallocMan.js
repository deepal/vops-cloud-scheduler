var deallocMan = require('../../core/scheduler/deallocationManager')();

deallocMan.undeploy({ allocationid: '54d786171730a35c5b5e72d8'}, function (err, res) {
    if(err){
        throw err;
    }
    else{
        console.log(res);
    }
});