package virtualops;


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
    public Response greeting(@RequestBody final PreemptionTicket[] pts) {
        JVirshServiceController controller = new JVirshServiceController();
        boolean isSuccess = false;
        int sizeCheck=0;
        for(int i=0;i<pts.length;i++){
            isSuccess = controller.saveIn(pts[i].getHostIP(),pts[i].getVmID());
            if (isSuccess){
                sizeCheck++;
            }

        }
        //Do whatever with the PreemptionTicket array !!!
        if(sizeCheck==pts.length) {
            return new Response(200, "Got the preemption list and states saved!!");
        }else if(sizeCheck==0&&pts.length!=0){
            return new Response(200, "Got list,but nothing was saved!!");
        }
        else if((sizeCheck<pts.length)&&sizeCheck>0){
            return new Response(200, "Got the preemption list and states saved of some,others error!!");
        }
        else {
            return new Response(200, "Invalid inputs!!");
        }
    }


    public boolean saveIn(String hostIp,String vmId){
        int size = hostIp.length();
        String lastDigits;
        StringBuilder sb = new StringBuilder();
        if(hostIp.charAt(size - 2)!='0') {
            sb.append(hostIp.charAt(size - 2));
        }
        sb.append(hostIp.charAt(size - 1));
        lastDigits = sb.toString();

        boolean success=false;
        SSHExec ssh = null;
        Result result=null;
        ConnBean cb = new ConnBean(hostIp, "root","vops");
        ssh = SSHExec.getInstance(cb);
        ssh.connect();
        CustomTask nt = new ExecCommand("virsh list");
        try{
            ssh.exec(nt);
            success = result.isSuccess;
            if (success) {
                CustomTask sampleTask = new ExecCommand("virsh save " + vmId + " /home/virtualops" + lastDigits + "/Desktop/" + vmId + "-" + hostIp + ".vmsav");
                result = ssh.exec(sampleTask);
                success = result.isSuccess;
                if (success) {
                    sampleTask = new ExecCommand("scp /home/virtualops" + lastDigits + "/Desktop/" + vmId + "-" + hostIp + ".vmsav root@10.8.100.201:/home/virtualops1/Desktop/");
                    result = ssh.exec(sampleTask);
                    success = result.isSuccess;
                }
            }
        }
        catch(Exception e){
            e.printStackTrace();
        }
        ssh.disconnect();

        return success;

    }

}
