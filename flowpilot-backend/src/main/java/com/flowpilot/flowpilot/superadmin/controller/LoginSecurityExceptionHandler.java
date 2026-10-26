package com.flowpilot.flowpilot.superadmin.controller;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class LoginSecurityExceptionHandler {


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
