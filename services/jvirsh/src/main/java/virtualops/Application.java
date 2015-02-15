package virtualops;

/**
 * Created by virtualops on 2/2/15.
 */
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.context.annotation.ComponentScan;

@ComponentScan
@EnableAutoConfiguration
public class Application {      //main class

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
