module.exports = function(){

    require('../../config');

    //var minPossibleStorageHost;

    var findMinPossibleStorageHost = function(resourceRequest, callback){

        var cloudstack = new (require('csclient'))({
            serverURL: CLOUDSTACK.API,
            apiKey: CLOUDSTACK.API_KEY,
            secretKey: CLOUDSTACK.SECRET_KEY
        });

        cloudstack.execute('listStoragePools', {}, function(err, storageItems){
            if(!err) {
                var minPossibleStorageHost = storageItems;
                callback(null, minPossibleStorageHost);
            }
            else{
                callback(err);
            }
        });


    };
    return{
        findMinPossibleStorageHost : findMinPossibleStorageHost
    }
};