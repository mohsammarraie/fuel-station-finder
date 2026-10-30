package com.fuelstationfinder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FuelStationApplication {
    public static void main(String[] args) {
        var context = SpringApplication.run(FuelStationApplication.class, args);
        var command = context.getEnvironment().getProperty("app.command");
        if (command != null) {
            try { context.getBean(MaintenanceCommands.class).run(command); }
            finally { context.close(); }
        }
    }
}
