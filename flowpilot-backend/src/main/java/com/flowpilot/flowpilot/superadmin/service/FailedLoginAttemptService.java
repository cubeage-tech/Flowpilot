package com.flowpilot.flowpilot.superadmin.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FailedLoginAttemptService {

    private final Map<String, Integer> failedAttempts =
            new ConcurrentHashMap<>();

    public int recordFailedAttempt(String email) {
        return failedAttempts.merge(
                email,
                1,
                Integer::sum
        );
    }

    public void resetAttempts(String email) {
        failedAttempts.remove(email);
    }

    public int getAttempts(String email) {
        return failedAttempts.getOrDefault(email, 0);
    }

    public void resetAfterAlert(String email) {
        failedAttempts.remove(email);
    }
}