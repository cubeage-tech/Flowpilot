package com.flowpilot.flowpilot.scrummaster.exception;

/** Thrown when the caller sent something the endpoint cannot accept. */
public class ScrumValidationException extends RuntimeException {

    public ScrumValidationException(String message) {
        super(message);
    }
}
