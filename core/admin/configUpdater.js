module.exports = function(){
    var validator = require('./adminValidator')();
    var jf = require('jsonfile');
    var response = require('../../config/responseMessages');

    var basepath = '';

    switch (process.env.USER){
        case 'deepal':
            basepath = '/home/deepal/projects/VirtualOps/VirtualOps';
            break;
        case 'vishmi':
            basepath = '/home/vishmi/projects/VirtualOps/';
            break;
        default:
            break;
    }

    var confFile = basepath+'/config/globalConfig.json';
    var readConfig = function (callback) {

        if(basepath == ''){
            callback(response.error(500, "You need to configure path to Scheduler Configuration file first!"));
        }

        jf.readFile(confFile, function (err, obj) {
            if(err){
                callback(response.error(500, "Could not read Scheduler Configuration file!", err));
            }
            else{
                if(obj){
                    callback(null, obj);
                }
                else{
                    callback("No configuration info available !");
                }
            }
        });
    }

    var writeConfig = function (adminSessID, configObj, callback){
        validator.validateAdmin(adminSessID, function(err, res){
            if(res.admin){
                jf.writeFile(confFile, configObj, function (err) {
                    if(err){
                        callback(response.error(500, "Could not update Scheduler Configuration file!", err));
                    }
                    else{
                        callback(null, "Configuration saved successfully!");
                    }
                });
            }
        });
    }

    return {
        readConfig: readConfig,
        writeConfig: writeConfig
    }
    
}