module.exports = function(){

    require('../../config');

    var findPossibleStorageHosts = function(resourceRequest, callback){

        var cloudstack = new (require('csclient'))({
            serverURL: CLOUDSTACK.API,
            apiKey: CLOUDSTACK.API_KEY,
            secretKey: CLOUDSTACK.SECRET_KEY
        });

        cloudstack.execute('listStoragePools', {}, function(err, storageItems){
            if(!err) {
                var allStorageHosts = storageItems;

                var possibleStorageHosts = [];

                resourceRequest = resourceRequest.group[0];
                var storageResponse = allStorageHosts.liststoragepoolsresponse;


                var requestingStorage = parseInt(resourceRequest.min_storage[0].primary[0]);

                for(var i=0; i< storageResponse.count; i++){
                    switch ((resourceRequest.min_storage[0].unit[0]).toLowerCase()){
                        case 'b':
                            break;
                        case 'kb':
                            requestingStorage = requestingStorage * 1024;
                            break;
                        case 'mb':
                            requestingStorage = requestingStorage * 1024 * 1024;
                            break;
                        case 'gb':
                            requestingStorage = requestingStorage * 1024 * 1024 * 1024;
                            break;
                        case 'tb':
                            requestingStorage = requestingStorage * 1024 * 1024 * 1024 * 2014;
                            break;
                        default :
                            callback(responseInfo.error(403, "Unsupported unit for min_storage in resource request!"));
                    }

                    var availableStorageInPool = storageResponse.storagepool[i].disksizetotal-storageResponse.storagepool[i].disksizeused;

                    if(requestingStorage <= availableStorageInPool){
                        possibleStorageHosts.push(storageResponse.storagepool[i]);
                    }
                }
                callback(null, possibleStorageHosts);
            }
            else{
                callback(err);
            }
        });
    };
    return {
        findPossibleStorageHosts : findPossibleStorageHosts
    }
};