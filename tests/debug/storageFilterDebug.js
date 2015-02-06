var storageFilter = new (require('../../core/scheduler/storageFilter'))(null);

storageFilter.findPossibleStorageHosts(resourceRequest, function(err, minStorageItems){
    if(!err) {
        console.log(JSON.stringify(minStorageItems));
    }
    else{
        throw err;
    }
});