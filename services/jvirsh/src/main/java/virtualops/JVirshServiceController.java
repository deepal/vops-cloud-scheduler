package virtualops;


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
<<<<<<< HEAD
    public Response greeting(@RequestBody final PreemptionTicket pts) {
=======
<<<<<<< HEAD
    public Response greeting(@RequestBody final PreemptionTicket pts) {
        //Do whatever with the PreemptionTicket !!!
        return  new Response(200, "Got the preemption list!!");
=======
    public Response greeting(@RequestBody final PreemptionTicket[] pts) {
>>>>>>> 698a5c0c1adedc01018ff2a115cff992ec4e8da8
        JVirshServiceController controller = new JVirshServiceController();
        Result result = null;
        int sizeCheck=0;
        String[] vm_ids=pts.getVmIDs();
        for(int i=0;i<vm_ids.length;i++){
                result = controller.saveIn(pts.getHostIP(), vm_ids[i]);
                if (result.isSuccess) {
                    sizeCheck++;
                }


        }
        //Do whatever with the PreemptionTicket array !!!
        if(sizeCheck==vm_ids.length) {
            return new Response(200, "Got the preemption list and states saved!!");
        }else if(sizeCheck==0&&vm_ids.length!=0){
            return new Response(404, "Got list,but nothing was saved!!  "+result.error_msg);
        }
        else if((sizeCheck<vm_ids.length)&&sizeCheck>0){
            return new Response(405, "Got the preemption list and states saved of some!! "+result.error_msg);
        }
        else {
            return new Response(406, "Invalid inputs!!  "+result.error_msg);
        }
    }


    public Result saveIn(String hostIp,String vmId){
        int size = hostIp.length();
        String lastDigits;
        StringBuilder sb = new StringBuilder();
        if(hostIp.charAt(size - 2)!='0') {
            sb.append(hostIp.charAt(size - 2));
        }
        sb.append(hostIp.charAt(size - 1));
        lastDigits = sb.toString();


        SSHExec.setOption(IOptionName.INTEVAL_TIME_BETWEEN_TASKS, 1);
        SSHExec ssh = null;
        ConnBean cb=null;
        Result result=null;
        if(lastDigits.equals("1")){
            cb = new ConnBean(hostIp, "virtualops1", "vops");
        }
        else {
            cb = new ConnBean(hostIp, "root", "vops");
        }
        ssh = SSHExec.getInstance(cb);

        ssh.connect();
        CustomTask nt = new ExecCommand("virsh list");
        int noOfCommands=0;
        try{
            result=ssh.exec(nt);

                if(result.isSuccess) {
                    CustomTask sampleTask = new ExecCommand("virsh dumpxml " + vmId + " > /home/virtualops" + lastDigits + "/Desktop/" + vmId + ".xml");
                    result = ssh.exec(sampleTask);

                    if(result.isSuccess) {
                        sampleTask = new ExecCommand("virsh save " + vmId + " /home/virtualops" + lastDigits + "/Desktop/" + vmId + ".vmsav");
                        result = ssh.exec(sampleTask);

                        if(result.isSuccess) {
                            sampleTask = new ExecCommand("scp /home/virtualops" + lastDigits + "/Desktop/" + vmId + ".vmsav root@10.8.100.201:/mnt/secondary/vmsaves/");
                            result = ssh.exec(sampleTask);

                            if(result.isSuccess) {
                                sampleTask = new ExecCommand("scp /home/virtualops" + lastDigits + "/Desktop/" + vmId + ".xml root@10.8.100.201:/mnt/secondary/vmsaves/");
                                result = ssh.exec(sampleTask);

                            }
                        }
                    }
                }



        }
        catch(Exception e){
            e.printStackTrace();
        }
        ssh.disconnect();

        return result;

>>>>>>> 3203409349e6e1aab84aad613fe82b9a33ed9515
    }

}
