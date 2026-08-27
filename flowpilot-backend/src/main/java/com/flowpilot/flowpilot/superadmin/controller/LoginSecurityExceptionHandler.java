package com.flowpilot.flowpilot.superadmin.controller;

import com.flowpilot.flowpilot.superadmin.service.EmailService;
import com.flowpilot.flowpilot.superadmin.service.FailedLoginAttemptService;

import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestControllerAdvice
@RequiredArgsConstructor
public class LoginSecurityExceptionHandler {

    private final FailedLoginAttemptService failedLoginAttemptService;
    private final EmailService emailService;


    @ExceptionHandler(BadCredentialsException.class)
    public void handleBadCredentials(
            BadCredentialsException exception,
            HttpServletRequest request
    ) {

        /*
         * We need the attempted email.
         *
         * Since the exception itself does not contain
         * the email, we retrieve it from the request.
         *
         * The login endpoint sends JSON containing:
         *
         * {
         *     "email": "...",
         *     "password": "..."
         * }
         *
         * However, the request body has already been consumed
         * by @RequestBody, so we cannot reliably read it here.
         *
         * Therefore, we will NOT send the alert from this
         * handler yet.
         */
    }
}