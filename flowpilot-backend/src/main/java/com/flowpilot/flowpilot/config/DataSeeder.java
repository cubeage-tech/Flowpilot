package com.flowpilot.flowpilot.config;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUser("superadmin@flowpilot.com", "SuperAdmin@123", "SUPER_ADMIN", "Super Admin");
        seedUser("admin@flowpilot.com",      "Admin@123",      "ADMIN",       "Admin");
        seedUser("pm@flowpilot.com",         "Admin@123",      "PROJECT_MANAGER", "Project Manager");
        seedUser("sm@flowpilot.com",         "Admin@123",      "SCRUM_MASTER", "Scrum Master");
        seedUser("dev@flowpilot.com",        "Admin@123",      "DEVELOPER",   "Developer");
        seedUser("qa@flowpilot.com",         "Admin@123",      "QA_ENGINEER", "QA Engineer");
        seedUser("viewer@flowpilot.com",     "Admin@123",      "VIEWER",      "Viewer");
    }

    private void seedUser(String email, String rawPassword, String role, String name) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setRole(role);
            user.setName(name);
            userRepository.save(user);
            System.out.println("Seeded user: " + email);
        }
    }
}
