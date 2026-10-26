package com.flowpilot.flowpilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class FlowpilotApplication {

	public static void main(String[] args) {
		SpringApplication.run(FlowpilotApplication.class, args);
	}

}
