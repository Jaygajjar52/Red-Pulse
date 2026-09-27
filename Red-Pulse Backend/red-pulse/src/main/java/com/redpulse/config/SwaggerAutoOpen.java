package com.redpulse.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.awt.Desktop;
import java.net.URI;

@Component
public class SwaggerAutoOpen {

    @EventListener(ApplicationReadyEvent.class)
    public void openSwagger() {

        try {
            if (Desktop.isDesktopSupported()) {

                Desktop.getDesktop().browse(
                        new URI("http://localhost:8080/swagger-ui/index.html")
                );

                System.out.println("Swagger UI opened in browser.");

            } else {
                System.out.println(
                        "Desktop is not supported. Open Swagger manually at: " +
                                "http://localhost:8080/swagger-ui/index.html"
                );
            }

        } catch (Exception e) {

            System.err.println(
                    "Could not open Swagger UI: " + e.getMessage()
            );
        }
    }
}
