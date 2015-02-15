package virtualops;

/**
 * Created by shemil on 2/7/15.
 */

import net.neoremind.sshxcute.core.IOptionName;
import org.springframework.web.bind.annotation.*;
import net.neoremind.sshxcute.core.ConnBean;
import net.neoremind.sshxcute.core.Result;
import net.neoremind.sshxcute.core.SSHExec;
import net.neoremind.sshxcute.task.CustomTask;
import net.neoremind.sshxcute.task.impl.ExecCommand;

import org.junit.Before;
import org.junit.Test;

public class JVirshControllerTest{
    private static String hostIP = "10.8.100.203";
    private static String[] vmIDs = {"i-2-176-VM","i-2-178-VM"};
    private static JVirshServiceController jvirshcontroller= new JVirshServiceController();
    private static PreemptionTicket pts = new PreemptionTicket(vmIDs,hostIP);

        @Test
        public void testPreemptVM(){
            try{
                Response response = jvirshcontroller.preemptVM(pts);
            }
            catch(Exception e){
                e.printStackTrace();
            }
        }

        @Test
        public void testSaveIn(){
            try{
                Result result = jvirshcontroller.saveIn(hostIP,vmIDs[0]);
            }
            catch(Exception e){
                e.printStackTrace();
            }
        }

        @Test
        public void testRestore(){
            try{
                boolean success = jvirshcontroller.restore(hostIP,vmIDs[0]);
            }
            catch(Exception e){
                e.printStackTrace();
            }
    }

        }