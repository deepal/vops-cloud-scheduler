package virtualops;

/**
 * Created by shemil on 2/2/15.
 */
import net.neoremind.sshxcute.core.IOptionName;
import org.springframework.web.bind.annotation.*;
import net.neoremind.sshxcute.core.ConnBean;
import net.neoremind.sshxcute.core.Result;
import net.neoremind.sshxcute.core.SSHExec;
import net.neoremind.sshxcute.task.CustomTask;
import net.neoremind.sshxcute.task.impl.ExecCommand;

@RestController
@RequestMapping("/preempt")
public class JVirshServiceController {

    @RequestMapping(method = RequestMethod.POST)


    public Response preemptVM(@RequestBody final PreemptionTicket pts) {

        JVirshServiceController controller = new JVirshServiceController();
        Result result = null;                                               //sshxcute class to get the result,includes success state and error message
        int sizeCheck=0;
        String[] vm_ids=pts.getVmIDs();                                     //takes the input vmids of the VMS,vmid is the name of the VM
        for(int i=0;i<vm_ids.length;i++){                                   //for all VMids
                result = controller.saveIn(pts.getHostIP(), vm_ids[i]);     //run saveIn function,need host ip and vm name to be preempted
                if (result.isSuccess) {                                     //if success,increase number of successes
                    sizeCheck++;
                }


        }

        if(sizeCheck==vm_ids.length) {                                      //if all vm preempt were success,return 200 and the host ip
            return new Response(200, pts.getHostIP());
        }
        else {                                                              //else return null and 500
            return new Response(500, null);
        }
    }


    public Result saveIn(String hostIp,String vmId){                        //function to preempt and save the snapshot in the secondary
        int size = hostIp.length();                                         //this section takes the ip and derives username of the host pc to ssh-host usernames adhere virtualops+last 2 digits of the ip
        String lastDigits;
        StringBuilder sb = new StringBuilder();
        if(hostIp.charAt(size - 2)!='0') {
            sb.append(hostIp.charAt(size - 2));
        }
        sb.append(hostIp.charAt(size - 1));
        lastDigits = sb.toString();

                                                                            //set the interval times to execute commands
        SSHExec.setOption(IOptionName.INTEVAL_TIME_BETWEEN_TASKS, 1);
        SSHExec ssh = null;                                                 //ssh object
        ConnBean cb=null;                                                   //connection object
        Result result=null;                                                 //result object
        if(lastDigits.equals("1")){
            cb = new ConnBean(hostIp, "virtualops1", "vops");
        }
        else {
            cb = new ConnBean(hostIp, "root", "vops");
        }
        ssh = SSHExec.getInstance(cb);                                      //get the given instance with the given connection details

        ssh.connect();      //connect to the host
///        CustomTask nt = new ExecCommand("virsh list");      //create a task to be deployed in the host - string is a bash command
        int noOfCommands=0;
        try{
   //         result=ssh.exec(nt);    //execute the specified command

              //  if(result.isSuccess) {  //if only connection was successful,go to next step
                    CustomTask sampleTask = new ExecCommand("virsh dumpxml " + vmId + " > /home/virtualops" + lastDigits + "/Desktop/" + vmId + ".xml");
                    result = ssh.exec(sampleTask); //dump the xml file of the VM to preempt,xml contains details of the vm

                    if(result.isSuccess) { //if xml dump success,preempt vm
                        sampleTask = new ExecCommand("virsh save " + vmId + " /home/virtualops" + lastDigits + "/Desktop/" + vmId + ".vmsav");
                        result = ssh.exec(sampleTask);      //preempt and save the snapshot as a .vmsav file

                        if(result.isSuccess) {  //if only snapshot was success,continue
                            sampleTask = new ExecCommand("scp /home/virtualops" + lastDigits + "/Desktop/" + vmId + ".vmsav root@10.8.100.201:/mnt/secondary/vmsaves/");
                            result = ssh.exec(sampleTask);    //remote copy to secondary

                            if(result.isSuccess) { //if copy to secondary completed,continue
                                sampleTask = new ExecCommand("scp /home/virtualops" + lastDigits + "/Desktop/" + vmId + ".xml root@10.8.100.201:/mnt/secondary/vmsaves/");
                                result = ssh.exec(sampleTask);  // remote copy the xml
                                if(result.isSuccess){ //if remote copy success,continue
                                    sampleTask = new ExecCommand("rm /home/virtualops" + lastDigits + "/Desktop/" + vmId + ".xml");
                                    result = ssh.exec(sampleTask);  //delete the local copy of xml
                                    sampleTask = new ExecCommand("rm /home/virtualops" + lastDigits + "/Desktop/" + vmId + ".vmsav");
                                    result = ssh.exec(sampleTask);//delete the local copy of vmsav
                                }

                            }
                        }
                    }
              //  }



        }
        catch(Exception e){
            e.printStackTrace();
        }
        ssh.disconnect();   //close the ssh connection

        return result;          //return result,if the process was a total success result.isSuccess is true,if single step fails,result.isSuccess is false


    }

    public boolean restore(String destIP,String vmID){
        int size = destIP.length();
        String lastDigits;
        StringBuilder sb = new StringBuilder();
        if(destIP.charAt(size - 2)!='0') {
            sb.append(destIP.charAt(size - 2));
        }
        sb.append(destIP.charAt(size - 1));
        lastDigits = sb.toString();             //get last digits and get the username
        boolean success=false;
        SSHExec ssh = null;
        Result result=null;
        ConnBean cb = new ConnBean(destIP, "root","vops");      //connection details,username,password,and destination ip
        ssh = SSHExec.getInstance(cb);                          //get the ssh instance
        ssh.connect();                                          //connect to the destination
        CustomTask sampleTask = new ExecCommand("virsh restore /home/virtualops"+lastDigits+"/Desktop/"+vmID+".vmsav");
                        //restoring command
        try{
            result=ssh.exec(sampleTask);        //execute the restore command
        }
        catch(Exception e){
            e.printStackTrace();
        }
        ssh.disconnect();

        success = result.isSuccess;
        
        return success;

    }

}
