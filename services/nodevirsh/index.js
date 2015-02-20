/**
 * Created by deepal on 2/20/15.
 */

module.exports = function(){

    require('../../config');

    //usernames and passwords associated with accounts in each host
    var hostaccounts = {
        '10.8.100.201':{
            username: 'virtualops1',
            password: 'vops'
        },
        '10.8.100.202':{
            username: 'virtualops2',
            password: 'vops'
        },
        '10.8.100.203':{
            username: 'virtualops3',
            password: 'vops'
        },
        '10.8.100.204':{
            username: 'virtualops4',
            password: 'vops'
        }
    };

    var exec = require('node-ssh-exec');
    var response = require('../../config/responseMessages');

    //execute ssh command
    var sshexec = function (command, hostname, user, password, callback) {
        var config = {
            host: hostname,
            username: user,
            password: password
        };

        //perform execution of command over ssh
        exec(config, command, function (error, res) {
            if(err){
                callback(response.error(500, ERROR.NODEVIRSH_SERVICE_ERROR, error));
            }
            else{
                callback(null, res);
            }
        });
    };

    var preemptVMs = function (index, vmList, hostIP, callback) {
        if(index >= vmList.length){
            callback(null, response.success(200, "Preemption Complete!"));
        }
        else{
            var instanceName = vmList[index];
            var username = hostaccounts[hostIP].username;
            var password = hostaccounts[hostIP].password;

            //dump the xml file of the VM to be preempted.XML contains details of the VM
            sshexec('virsh dumpxml ' + instanceName + ' > /home/' + hostaccounts[hostIP] + '/Desktop/' + instanceName + '.xml', hostIP, username, password, function (err, res) {
                if(err){
                    callback(err);
                }
                else{
                    //save the snapshot of VM as a .vmsav file
                    sshexec('virsh save ' + instanceName + ' > /home/' + hostaccounts[hostIP] + '/Desktop/' + instanceName + '.vmsav', hostIP, username, password, function (err, res) {
                        if(err){
                            callback(err);
                        }
                        else{
                            //copy snapshot to secondary storage
                            sshexec('scp /home/'+username+'/Desktop'+vmList[index]+'.vmsav root@'+SEC_STORAGE_IP+':'+SEC_STORAGE_MOUNT_POINT+'/vmsaves/', hostIP, username, password, function (err, res) {
                                if(err){
                                    callback(err);
                                }
                                else{
                                    //copy vm configuration file to secondary storage
                                    sshexec('scp /home/'+username+'/Desktop'+vmList[index]+'.xml root@'+secStorageIP+':'+secStorageMP+'/vmsaves/', hostIP, username, password, function (err, res) {
                                        if(err){
                                            callback(err);
                                        }
                                        else{
                                            //remove vm configuration file from host
                                            sshexec('rm /home/'+username+'/Desktop'+vmList[index]+'.xml', hostIP, username, password, function (err, res) {
                                                if(err){
                                                    callback(err);
                                                }
                                                else{
                                                    //remove vm snapshot file from host
                                                    sshexec('rm /home/'+username+'/Desktop'+vmList[index]+'.vmsav', hostIP, username, password, function (err, res) {
                                                        if(err){
                                                            callback(err);
                                                        }
                                                        else{
                                                            //if no errors raised upto this point, proceed and preempt the next VM
                                                            index++;
                                                            preemptVMs(index,vmList, hostIP, callback);
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    };

    return {
        preemptVMs: preemptVMs
    }

};