package com.flowpilot.flowpilot.scrummaster.exception;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.hibernate.exception.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.fasterxml.jackson.core.JsonLocation;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Scoped to the Scrum Master controllers only.
 *
 * The application-wide handler maps every exception to 500, which hides the
 * difference between "you sent something invalid" and "the server broke".
 * Narrowing this to our own package lets these endpoints answer 400 and 404
 * correctly without changing behaviour for anyone else's module.
 *
 * Framework-level binding failures (a bad path variable, a broken JSON body,
 * a missing query parameter) are the caller's mistake, not a server fault, so
 * they are mapped here too instead of falling through to that 500.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(basePackages = "com.flowpilot.flowpilot.scrummaster")
public class ScrumExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(ScrumExceptionHandler.class);


    // ============================================
    // Our own exceptions
    // ============================================

    @ExceptionHandler(ScrumNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            ScrumNotFoundException ex) {

        return respond(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ScrumValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            ScrumValidationException ex) {

        return respond(HttpStatus.BAD_REQUEST, ex.getMessage());
    }


    // ============================================
    // 400 - the caller sent something unusable
    // ============================================

    /** A path variable or query parameter that could not be converted. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex) {

        StringBuilder message = new StringBuilder()
                .append("'")
                .append(ex.getName())
                .append("' must be ")
                .append(describe(ex.getRequiredType()));

        Object value = ex.getValue();
        if (value != null) {
            message.append(", but received '").append(value).append("'");
        }
        message.append(".");

        return respond(HttpStatus.BAD_REQUEST, message.toString());
    }

    /** Malformed JSON, a wrong-typed field, or no body at all. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableBody(
            HttpMessageNotReadableException ex) {

        return respond(HttpStatus.BAD_REQUEST, describeUnreadableBody(ex));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParameter(
            MissingServletRequestParameterException ex) {

        String message = "Required parameter '" + ex.getParameterName()
                + "' is missing. It must be " + describe(ex.getParameterType()) + ".";

        return respond(HttpStatus.BAD_REQUEST, message);
    }

    /**
     * Bean validation and form/query binding failures. MethodArgumentNotValid
     * extends BindException, so one handler covers both.
     */
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ResponseEntity<Map<String, Object>> handleBindingErrors(
            BindException ex) {

        List<String> problems = new ArrayList<>();
        for (ObjectError error : ex.getAllErrors()) {
            String detail = error.getDefaultMessage() == null
                    ? "is not valid"
                    : error.getDefaultMessage();

            if (error instanceof FieldError fieldError) {
                problems.add("'" + fieldError.getField() + "' " + detail);
            } else {
                problems.add(detail);
            }
        }

        String message = problems.isEmpty()
                ? "The request contained values this endpoint cannot accept."
                : "Invalid request: " + String.join("; ", problems) + ".";

        return respond(HttpStatus.BAD_REQUEST, message);
    }


    // ============================================
    // 404 / 405 / 409
    // ============================================

    /**
     * Only reached when the request already resolved into this package, e.g.
     * a nested dispatch. A URL that never matched a Scrum controller cannot be
     * attributed to a base package and so stays with the global handler.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResource(
            NoResourceFoundException ex) {

        return respond(HttpStatus.NOT_FOUND,
                "No endpoint matches " + ex.getHttpMethod() + " /" + ex.getResourcePath() + ".");
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoHandler(
            NoHandlerFoundException ex) {

        return respond(HttpStatus.NOT_FOUND,
                "No endpoint matches " + ex.getHttpMethod() + " " + ex.getRequestURL() + ".");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex) {

        Set<HttpMethod> supported = ex.getSupportedHttpMethods();

        StringBuilder message = new StringBuilder()
                .append("Method ")
                .append(ex.getMethod())
                .append(" is not supported by this endpoint.");

        HttpHeaders headers = new HttpHeaders();
        if (supported != null && !supported.isEmpty()) {
            message.append(" Supported: ")
                   .append(String.join(", ", ex.getSupportedMethods()))
                   .append(".");
            // Allow is part of the 405 contract, so clients see it as well
            headers.setAllow(supported);
        }

        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .headers(headers)
                .body(Map.of("success", false, "message", message.toString()));
    }

    /**
     * A unique key, foreign key or NOT NULL column rejected the write. The
     * driver message carries the SQL statement, so it is logged rather than
     * returned; the caller only needs to know which constraint refused.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(
            DataIntegrityViolationException ex) {

        String constraint = constraintName(ex);
        log.warn("Data integrity violation on a Scrum Master write (constraint={})",
                constraint == null ? "unknown" : constraint, ex);

        String message = constraint == null
                ? "This change was refused by a database constraint - a value may already"
                        + " be in use, a required field may be empty, or a referenced record"
                        + " may no longer exist."
                : "This change was refused by the database constraint '" + constraint
                        + "' - a value may already be in use, or a referenced record may no"
                        + " longer exist.";

        return respond(HttpStatus.CONFLICT, message);
    }


    // ============================================
    // Last resort
    // ============================================

    /**
     * Scoped to this package so a genuine fault is logged with the request that
     * caused it, instead of being swallowed as an anonymous 500 elsewhere.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(
            Exception ex, HttpServletRequest request) throws Exception {

        // Spring Security answers 401/403 by letting these travel back up the
        // filter chain; handling them here would report an auth failure as 500
        if (ex instanceof AccessDeniedException || ex instanceof AuthenticationException) {
            throw ex;
        }

        log.error("Unhandled exception in Scrum Master endpoint {} {}",
                request.getMethod(), request.getRequestURI(), ex);

        return respond(HttpStatus.INTERNAL_SERVER_ERROR,
                "Something went wrong while handling this request. The error has been logged.");
    }


    // ============================================
    // Helpers
    // ============================================

    private static ResponseEntity<Map<String, Object>> respond(
            HttpStatus status, String message) {

        String text = (message == null || message.isBlank())
                ? "The request could not be completed."
                : message;

        return ResponseEntity
                .status(status)
                .body(Map.of("success", false, "message", text));
    }

    private static String describeUnreadableBody(HttpMessageNotReadableException ex) {
        Throwable cause = ex.getCause();

        // Wrong-typed value: Jackson knows both the field and what it wanted
        if (cause instanceof InvalidFormatException invalidFormat) {
            String field = fieldPath(invalidFormat.getPath());
            return "Field " + quotedOr(field, "in the request body")
                    + " must be " + describe(invalidFormat.getTargetType())
                    + ", but received '" + invalidFormat.getValue() + "'.";
        }

        if (cause instanceof MismatchedInputException mismatched) {
            String field = fieldPath(mismatched.getPath());
            return field.isEmpty()
                    ? "The request body does not match the shape this endpoint expects."
                    : "Field '" + field + "' has the wrong type for this endpoint.";
        }

        if (cause instanceof JsonProcessingException parseFailure) {
            JsonLocation location = parseFailure.getLocation();
            String where = location == null
                    ? ""
                    : " (line " + location.getLineNr() + ", column " + location.getColumnNr() + ")";
            return "The request body is not valid JSON" + where + ".";
        }

        // No cause at all is how Spring reports an absent body
        String detail = ex.getMessage();
        if (detail != null && detail.contains("Required request body is missing")) {
            return "A JSON request body is required for this endpoint.";
        }

        return "The request body could not be read; send valid JSON.";
    }

    private static String fieldPath(List<JsonMappingException.Reference> path) {
        if (path == null) {
            return "";
        }

        StringBuilder built = new StringBuilder();
        for (JsonMappingException.Reference reference : path) {
            if (reference.getFieldName() != null) {
                if (built.length() > 0) {
                    built.append('.');
                }
                built.append(reference.getFieldName());
            } else if (reference.getIndex() >= 0) {
                built.append('[').append(reference.getIndex()).append(']');
            }
        }
        return built.toString();
    }

    private static String quotedOr(String field, String fallback) {
        return field.isEmpty() ? fallback : "'" + field + "'";
    }

    private static String describe(Class<?> type) {
        return type == null ? "a valid value" : describe(type.getSimpleName());
    }

    /** Turns a Java type name into something a client developer can act on. */
    private static String describe(String typeName) {
        if (typeName == null) {
            return "a valid value";
        }

        return switch (typeName) {
            case "Long", "long", "Integer", "int", "Short", "short", "BigInteger" ->
                    "a whole number";
            case "Double", "double", "Float", "float", "BigDecimal" ->
                    "a number";
            case "Boolean", "boolean" ->
                    "true or false";
            case "LocalDate" ->
                    "a date in YYYY-MM-DD form";
            case "LocalTime" ->
                    "a time in HH:MM form";
            case "LocalDateTime", "Instant", "OffsetDateTime", "ZonedDateTime" ->
                    "an ISO-8601 date and time";
            case "UUID" ->
                    "a UUID";
            case "String" ->
                    "text";
            default ->
                    "a valid " + typeName + " value";
        };
    }

    /**
     * Hibernate reports the offending constraint one or two levels below the
     * Spring wrapper, so the cause chain is walked rather than assumed.
     */
    private static String constraintName(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            if (current instanceof ConstraintViolationException violation) {
                String name = violation.getConstraintName();
                return (name == null || name.isBlank()) ? null : name;
            }
            Throwable next = current.getCause();
            current = (next == current) ? null : next;
        }
        return null;
    }
}
