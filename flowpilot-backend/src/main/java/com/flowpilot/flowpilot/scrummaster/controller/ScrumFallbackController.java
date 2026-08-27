package com.flowpilot.flowpilot.scrummaster.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Catches any /api/scrummaster/** request that no real endpoint claimed.
 *
 * Without this, two failures escape the module's own error handling: a wrong
 * HTTP method and an unknown path are both raised by Spring's handler mapping
 * *before* a controller is chosen, so a package-scoped @RestControllerAdvice
 * never sees them and the application-wide handler reports them as 500.
 *
 * Routing them through a controller that does live in this package puts them
 * back under ScrumExceptionHandler, which answers 404. Spring always prefers a
 * more specific mapping, so every real endpoint still wins over this one.
 */
@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumFallbackController {

    @RequestMapping(
        value = "/api/scrummaster/**",
        method = {
            RequestMethod.GET,
            RequestMethod.POST,
            RequestMethod.PUT,
            RequestMethod.PATCH,
            RequestMethod.DELETE,
            RequestMethod.HEAD,
            RequestMethod.OPTIONS
        }
    )
    public void unmatched(HttpServletRequest request) {

        throw new ScrumNotFoundException(
                "No Scrum Master endpoint answers " + request.getMethod()
                        + " " + request.getRequestURI()
                        + ". Check the path and the HTTP method."
        );
    }
}
