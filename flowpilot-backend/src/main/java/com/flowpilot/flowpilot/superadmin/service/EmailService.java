package com.flowpilot.flowpilot.superadmin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;


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

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setTo(recipientEmail);

        message.setSubject(
                "Welcome to FlowPilot - Your Account Details"
        );

        message.setText(
                "Hello " + name + ",\n\n" +

                "Welcome to FlowPilot!\n\n" +

                "Your account has been created by the Super Administrator.\n\n" +

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

    /*
     * Super Administrator receives the security alert.
     * Change this email if your actual Super Admin email
     * is different.
     */
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

    mailSender.send(message);
}
}