module.exports = function(){

    var findHostByMigration = function(authorizedRequest, allHostInfo, callback){
        console.log(allHostInfo);
        console.log(authorizedRequest);
    };

    return {
        findHostByMigration: findHostByMigration
    }
};
