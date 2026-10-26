package com.flowpilot.flowpilot.superadmin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:adiiitya0814@gmail.com}")
    private String fromEmail;

    /*
     * ============================================================
     * WELCOME EMAIL
     * ============================================================
     */
    public void sendWelcomeEmail(
            String recipientEmail,
            String name,
            String password,
            String role,
            String department,
            String designation
    ) {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                if (fromEmail != null && !fromEmail.isBlank()) {
                    message.setFrom(fromEmail);
                }
                message.setTo(recipientEmail);
                message.setSubject("Welcome to FlowPilot - Your Account Details");
                message.setText(
                        "Hello " + name + ",\n\n" +
                        "Welcome to FlowPilot!\n\n" +
                        "Your account has been created by the Administrator.\n\n" +
                        "ACCOUNT DETAILS\n" +
                        "-------------------------\n" +
                        "Name: " + name + "\n" +
                        "Email: " + recipientEmail + "\n" +
                        "Role: " + role + "\n" +
                        "Department: " + department + "\n" +
                        "Designation: " + designation + "\n\n" +
                        "LOGIN CREDENTIALS\n" +
                        "-------------------------\n" +
                        "Email: " + recipientEmail + "\n" +
                        "Temporary Password: " + password + "\n\n" +
                        "Please use these credentials to log in to FlowPilot.\n" +
                        "For security, please change your password after your first login.\n\n" +
                        "Regards,\n" +
                        "FlowPilot Team"
                );
                mailSender.send(message);
                log.info("Welcome email sent to {}", recipientEmail);
            } catch (Exception e) {
                log.error("Failed to send welcome email to {}: {}", recipientEmail, e.getMessage());
            }
        });
    }

    /*
     * ============================================================
     * PASSWORD RESET EMAIL
     * ============================================================
     */
    public void sendPasswordResetEmail(
            String recipientEmail,
            String name,
            String newPassword
    ) {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                if (fromEmail != null && !fromEmail.isBlank()) {
                    message.setFrom(fromEmail);
                }
                message.setTo(recipientEmail);
                message.setSubject("FlowPilot - Your Password Has Been Reset");
                message.setText(
                        "Hello " + name + ",\n\n" +
                        "Your FlowPilot account password has been reset by an administrator.\n\n" +
                        "NEW LOGIN CREDENTIALS\n" +
                        "-------------------------\n" +
                        "Email: " + recipientEmail + "\n" +
                        "New Password: " + newPassword + "\n\n" +
                        "Please log in and update your password immediately from your profile settings.\n\n" +
                        "Regards,\n" +
                        "FlowPilot Security Team"
                );
                mailSender.send(message);
                log.info("Password reset email sent to {}", recipientEmail);
            } catch (Exception e) {
                log.error("Failed to send password reset email to {}: {}", recipientEmail, e.getMessage());
            }
        });
    }


    /*
     * ============================================================
     * FAILED LOGIN SECURITY ALERT
     * ============================================================
     *
     * This email is sent to the Super Administrator after
     * 3 consecutive failed login attempts.
     */
    public void sendFailedLoginAlert(
        String attemptedEmail,
        String device,
        String ipAddress,
        String time
) {

    SimpleMailMessage message =
            new SimpleMailMessage();

    if (fromEmail != null && !fromEmail.isBlank()) {
        message.setFrom(fromEmail);
    }

    message.setTo("nishadfulzele@gmail.com");

    message.setSubject(
            "FlowPilot Security Alert - 3 Failed Login Attempts"
    );

    message.setText(
            "FlowPilot Security Alert\n\n" +

            "⚠ 3 Failed Login Attempts\n\n" +

            "There have been 3 consecutive failed login attempts " +
            "on a FlowPilot account.\n\n" +

            "Attempted Account\n" +
            "-------------------------\n" +
            "Email: " + attemptedEmail + "\n\n" +

            "Device\n" +
            "-------------------------\n" +
            device + "\n\n" +

            "IP Address\n" +
            "-------------------------\n" +
            ipAddress + "\n\n" +

            "Time\n" +
            "-------------------------\n" +
            time + "\n\n" +

            "If this activity was not authorized, please review " +
            "the account and take appropriate security action.\n\n" +

            "Regards,\n" +
            "FlowPilot Security Team"
    );

    try {
        mailSender.send(message);
    } catch (Exception e) {
        log.error("Failed to send failed login alert email: {}", e.getMessage());
    }
}
}
