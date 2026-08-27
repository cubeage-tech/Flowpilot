package com.flowpilot.flowpilot.superadmin.service;

import com.flowpilot.flowpilot.common.dto.LoginRequestDto;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
public class FailedLoginAttemptAspect {

    private final FailedLoginAttemptService failedLoginAttemptService;
    private final EmailService emailService;

    /*
     * Monitors the existing AuthService.login() method
     * without modifying AuthService.java.
     */
    @Pointcut(
        "execution(* com.flowpilot.flowpilot.common.service.AuthService.login(..))"
    )
    public void loginMethod() {
    }

    /*
     * Successful login:
     * reset the failed-login counter for that email.
     */
    @AfterReturning(
        pointcut = "loginMethod() && args(request)",
        returning = "response"
    )
    public void successfulLogin(
            LoginRequestDto request,
            Object response
    ) {
        failedLoginAttemptService.resetAttempts(
            request.getEmail()
        );
    }

    /*
     * Failed login:
     * record the failed attempt.
     */
    @AfterThrowing(
        pointcut = "loginMethod() && args(request)",
        throwing = "exception"
    )
    public void failedLogin(
            LoginRequestDto request,
            Throwable exception
    ) {

        // Only count invalid username/password attempts.
        if (!(exception instanceof BadCredentialsException)) {
            return;
        }

        String attemptedEmail = request.getEmail();

        int attempts =
                failedLoginAttemptService.recordFailedAttempt(
                    attemptedEmail
                );

        System.out.println(
            "FAILED LOGIN DETECTED: "
            + attemptedEmail
            + " | Attempt #"
            + attempts
        );

        /*
         * Send the security alert exactly after
         * the third consecutive failed attempt.
         */
        if (attempts == 3) {

            System.out.println(
                "3 FAILED LOGIN ATTEMPTS REACHED - "
                + "SENDING SECURITY ALERT"
            );

            String time =
                    java.time.LocalDateTime.now()
                        .format(
                            java.time.format.DateTimeFormatter
                                .ofPattern("yyyy-MM-dd HH:mm:ss")
                        );

            emailService.sendFailedLoginAlert(
                attemptedEmail,
                "Unknown",
                "Unknown",
                time
            );

            /*
             * Start counting again after the alert.
             */
            failedLoginAttemptService.resetAfterAlert(
                attemptedEmail
            );
        }
    }
}