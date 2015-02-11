package virtualops;

/**
 * Created by deepal on 2/9/15.
 */
public class Response {

    public int status;
    public String message;

    public Response(){

    }

    public Response(int s, String msg){
        this.status = s;
        this.message = msg;
    }
}
