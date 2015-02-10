package virtualops;


import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/preempt")
public class JVirshServiceController {

    @RequestMapping(method = RequestMethod.POST)
    public Response greeting(@RequestBody final PreemptionTicket pts) {
        //Do whatever with the PreemptionTicket !!!
        return  new Response(200, "Got the preemption list!!");
    }

}
