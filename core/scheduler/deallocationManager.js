module.exports = function () {

    var db = require('../db');
    var dbAllocation = require('../db/schemas/dbAllocation');
    var response = require('../../config/responseMessages');

    var cloudstack = new (require('csclient'))({
        serverURL: CLOUDSTACK.API,
        apiKey: CLOUDSTACK.API_KEY,
        secretKey: CLOUDSTACK.SECRET_KEY
    });

    /*

    undeploy function accepts following type input:

        keys:   a json object. Each key is optional, but any one of them is required at a time
                ex:-
                    {
                        vmid:
                        allocationid:
                        instancename:
                    }

        callback:   callback function

     */

    var undeploy = function (keys, callback) {
        if(keys.vmid){
            destroyVMByID(keys.vmid, function (err, cRes) {     //if VM ID is specified in
                if(err){
                    callback(err);
                }
                else{
                    dbAllocation.remove({ 'VM.VMID':keys.vmid }, function (err) {
                        if(err){
                            callback(response.error(500, ERROR.DB_CONNECTION_ERROR, err));
                        }
                        else{
                            callback(null, cRes);
                        }
                    });
                }
            });
        }
        else if(keys.allocationid){
            dbAllocation.findOne({ _id: (require('mongoose')).Types.ObjectId(keys.allocationid)}).exec(function (err, alloc) {
                if(err){
                    callback(response.error(500, ERROR.DB_CONNECTION_ERROR,err));
                }
                else{
                    destroyVMByID(alloc.VM.VMID, function (err, res) {
                        if(err){
                            callback(err);
                        }
                        else{
                            dbAllocation.remove({_id: keys.allocationid}, function (err) {
                                if(err){
                                    callback(response.error(500, ERROR.DB_CONNECTION_ERROR, err));
                                }
                                else{
                                    callback(null, res);
                                }
                            });
                        }
                    });
                }
            })
        }
        else if(keys.instancename){
            dbAllocation.findOne({'VM.InstanceName': keys.instancename}).exec(function (err, alloc) {
                if(err){
                    callback(response.error(500, ERROR.DB_CONNECTION_ERROR, res));
                }
                else{
                    destroyVMByID(alloc.VM.VMID, function (err, res) {
                        if(err){
                            callback(err);
                        }
                        else{
                            dbAllocation.remove({ 'VM.InstanceName' : keys.instancename}, function (err) {
                                if(err){
                                    callback(response.error(500, ERROR.DB_CONNECTION_ERROR, err));
                                }
                                else{
                                    callback(null, res);
                                }
                            });
                        }
                    });
                }
            });
        }
    };

    var destroyVMByID = function (vmid, callback) {
        cloudstack.execute(CLOUDSTACK.METHODS.DESTROY_VM, {
            id:vmid,
            expunge: true
        }, function (err, result) {
            if(err){
                callback(response.error(500, ERROR.CLOUDSTACK_ERROR, err));
            }
            else{
                callback(null, result);
            }
        });
    };

    return {
        undeploy: undeploy
    }
};