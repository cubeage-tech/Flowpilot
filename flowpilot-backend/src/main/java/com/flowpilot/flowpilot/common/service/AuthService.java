package com.flowpilot.flowpilot.common.service;

import com.flowpilot.flowpilot.common.dto.LoginRequestDto;
import com.flowpilot.flowpilot.common.dto.LoginResponseDto;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.security.JwtTokenProvider;
import com.flowpilot.flowpilot.superadmin.repository.SuperAdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final SuperAdminUserRepository superAdminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public LoginResponseDto login(LoginRequestDto request) {

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new BadCredentialsException(
                                "Invalid email or password"
                        )
                );

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        )) {
            throw new BadCredentialsException(
                    "Invalid email or password"
            );
        }

        /*
         * Verify that the role selected during login
         * matches the role assigned to the user.
         */
        String reqRole = normalizeRole(request.getRole());
        String userRole = normalizeRole(user.getRole());

        if (reqRole.isEmpty() || !reqRole.equals(userRole)) {
                
            throw new BadCredentialsException(
                    "You are not authorized to login with this role"
            );
        }

        /*
         * Update last login for users managed by Super Admin.
         */
        superAdminUserRepository.findByEmail(user.getEmail())
                .ifPresent(superAdminUser -> {

                    superAdminUser.setLastLogin(
                            LocalDateTime.now()
                    );

                    superAdminUserRepository.save(
                            superAdminUser
                    );
                });

        String token = jwtTokenProvider.generateToken(
                user.getEmail(),
                user.getRole()
        );

        /*
         * Return the role selected on the login page.
         * This keeps the frontend role names consistent
         * even if the database stores roles in uppercase.
         */
        return new LoginResponseDto(
                token,
                request.getRole().trim(),
                user.getEmail(),
                user.getName(),
                user.getId()
        );
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        if (email == null || email.isBlank()) {
            throw new BadCredentialsException("Authentication required to change password.");
        }
        if (currentPassword == null || currentPassword.isBlank()) {
            throw new IllegalArgumentException("Current password is required.");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("New password is required.");
        }
        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters.");
        }

        var user = userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new BadCredentialsException("User account not found."));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadCredentialsException("Current password does not match.");
        }

        String encoded = passwordEncoder.encode(newPassword);
        user.setPassword(encoded);
        userRepository.save(user);

        // Also synchronize in superadmin_users if present
        superAdminUserRepository.findByEmail(email.trim()).ifPresent(saUser -> {
            saUser.setPassword(encoded);
            superAdminUserRepository.save(saUser);
        });
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "";
        }
        return role.trim()
                .toUpperCase()
                .replace(" ", "_")
                .replace("-", "_");
    }
}