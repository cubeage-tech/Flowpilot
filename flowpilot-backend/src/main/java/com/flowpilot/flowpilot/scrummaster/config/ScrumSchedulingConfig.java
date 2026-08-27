package com.flowpilot.flowpilot.scrummaster.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Turns on Spring's scheduler so the nightly burndown snapshot can run.
 *
 * This lives in the scrummaster package rather than on FlowpilotApplication so
 * no shared file is modified. It enables scheduling for the whole application,
 * which is safe today because no other module declares @Scheduled — if another
 * team later adds one, it will simply start working as they intended.
 */
@Configuration
@EnableScheduling
public class ScrumSchedulingConfig {
}
