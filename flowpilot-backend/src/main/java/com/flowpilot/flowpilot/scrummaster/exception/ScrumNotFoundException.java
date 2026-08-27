package com.flowpilot.flowpilot.scrummaster.exception;

/** Thrown when a sprint, task or standup that was asked for does not exist. */
public class ScrumNotFoundException extends RuntimeException {

    public ScrumNotFoundException(String message) {
        super(message);
    }
}
