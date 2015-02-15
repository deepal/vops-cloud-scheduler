package virtualops;

/**
 * Created by virtualops on 2/2/15.
 */
public class Response { //response which is returned

    public int status;      //int number, 200 for success,500 for fail
    public String message;      //host ip if success,null if failed

    public Response(){

    }

    public Response(int s, String msg){     //set
        this.status = s;
        this.message = msg;
    }
}
