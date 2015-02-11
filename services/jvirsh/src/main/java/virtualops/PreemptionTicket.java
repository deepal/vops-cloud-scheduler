package virtualops;

/**
 * Created by deepal on 2/9/15.
 */
public class PreemptionTicket {

    private String[] vmIDs;
    private String hostIP;


    public PreemptionTicket(){

    }

    public PreemptionTicket(String[] vmIDs, String hostIP){
        this.setVmID(vmIDs);
        this.setHostIP(hostIP);
    }

    public String[] getVmIDs() {
<<<<<<< HEAD
        return this.vmIDs;
=======
        return vmIDs;
>>>>>>> 698a5c0c1adedc01018ff2a115cff992ec4e8da8
    }

    public void setVmID(String[] vmIDs) {
        this.vmIDs = vmIDs;
    }

    public String getHostIP() {
        return hostIP;
    }

    public void setHostIP(String hostIP) {
        this.hostIP = hostIP;
    }
}
