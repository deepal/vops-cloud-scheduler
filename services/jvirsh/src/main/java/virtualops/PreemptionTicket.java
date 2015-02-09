package virtualops;

/**
 * Created by deepal on 2/9/15.
 */
public class PreemptionTicket {

    private String vmID;
    private String hostIP;


    public PreemptionTicket(){

    }

    public PreemptionTicket(String vmID, String hostIP){
        this.setVmID(vmID);
        this.setHostIP(hostIP);
    }

    public String getVmID() {
        return vmID;
    }

    public void setVmID(String vmID) {
        this.vmID = vmID;
    }

    public String getHostIP() {
        return hostIP;
    }

    public void setHostIP(String hostIP) {
        this.hostIP = hostIP;
    }
}
