package com.flowpilot.flowpilot.scrummaster.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumValidationException;

/**
 * Where attachment bytes live.
 *
 * Being plain about this: the SRS names AWS S3 or MinIO, and this project has
 * neither — no bucket, no credentials, no client library. So this class writes
 * to the local disk of whatever machine runs the backend. That is not object
 * storage and it is not pretending to be: files written here do not survive a
 * container rebuild and are not shared between instances.
 *
 * What it does buy is a narrow seam. Every byte in and out of the module goes
 * through store / load / delete / size and nothing else knows a path exists —
 * the entity keeps only an opaque key, the service and controller never touch
 * the filesystem. Moving to S3 or MinIO later means replacing this one class
 * (an S3 PutObject for store, a GetObject Resource for load) with no change to
 * the entity, the schema, the service, the controller or the API.
 */
@Service
public class ScrumFileStore {

    private static final Logger log = LoggerFactory.getLogger(ScrumFileStore.class);

    private final Path root;

    public ScrumFileStore(
            @Value("${scrum.attachments.dir:${java.io.tmpdir}/flowpilot-scrum-attachments}")
            String directory
    ) {
        this.root = Paths.get(directory).toAbsolutePath().normalize();
    }


    /**
     * Writes the stream and returns the key needed to read it back.
     *
     * The key is generated — a UUID plus a sanitised extension — and is never
     * derived from the client filename. A browser can send "../../etc/passwd",
     * an absolute Windows path or a name with a null byte in it, and any of
     * those used as a path would let an upload write outside the store. The
     * original name survives as display metadata on the entity instead.
     */
    public String store(InputStream data, String originalName) {

        if (data == null) {
            throw new ScrumValidationException("There is no file content to store");
        }

        String key = UUID.randomUUID() + extensionOf(originalName);
        Path target = resolve(key);

        try {
            // On demand rather than at startup: an instance that never receives
            // an upload has no reason to create a directory
            Files.createDirectories(this.root);
            Files.copy(data, target);
        } catch (IOException ex) {
            // A half-written file under a key no row will ever reference is
            // unreachable garbage, so clear it before reporting the failure
            deleteQuietly(target);
            throw new UncheckedIOException(
                    "Could not store attachment file " + key + " in " + this.root, ex);
        }

        return key;
    }


    @SuppressWarnings("null")
    public Resource load(String key) {

        Path source = resolve(key);

        if (!Files.isRegularFile(source)) {
            throw new ScrumNotFoundException(
                    "The stored file for this attachment is missing");
        }

        return new FileSystemResource(source);
    }


    /** Deleting bytes that are already gone is not an error. */
    public void delete(String key) {

        Path target = resolve(key);

        try {
            Files.deleteIfExists(target);
        } catch (IOException ex) {
            throw new UncheckedIOException(
                    "Could not delete attachment file " + key + " in " + this.root, ex);
        }
    }


    public long size(String key) {

        Path source = resolve(key);

        try {
            return Files.size(source);
        } catch (NoSuchFileException ex) {
            throw new ScrumNotFoundException(
                    "The stored file for this attachment is missing");
        } catch (IOException ex) {
            throw new UncheckedIOException(
                    "Could not measure attachment file " + key + " in " + this.root, ex);
        }
    }


    /**
     * Resolves a key inside the store and proves it stayed there.
     *
     * Defence in depth: keys are generated here so none of them can escape
     * today, but keys also travel through the database, and a row edited by
     * hand or a future caller that builds its own key must not be able to read
     * or delete an arbitrary file on the host.
     */
    private Path resolve(String key) {

        if (key == null || key.isBlank()) {
            throw new ScrumValidationException("A storage key is required");
        }

        Path candidate;

        try {
            candidate = this.root.resolve(key).normalize();
        } catch (InvalidPathException ex) {
            // A null byte or an illegal character never reaches the filesystem
            throw new ScrumValidationException("That storage key is not valid");
        }

        if (!candidate.startsWith(this.root) || candidate.equals(this.root)) {
            throw new ScrumValidationException("That storage key is not valid");
        }

        return candidate;
    }


    /** Keeps a short, safe extension so a download opens in the right app. */
    private String extensionOf(String name) {

        if (name == null) {
            return "";
        }

        int dot = name.lastIndexOf('.');

        if (dot < 0 || dot == name.length() - 1) {
            return "";
        }

        String raw = name.substring(dot + 1).toLowerCase();

        // Letters and digits only: a separator, a dot or a space has no
        // business in a generated path segment
        if (!raw.matches("[a-z0-9]{1,8}")) {
            return "";
        }

        return "." + raw;
    }


    private void deleteQuietly(Path target) {

        try {
            Files.deleteIfExists(target);
        } catch (IOException ex) {
            // The upload has already failed; losing the cleanup too must not
            // replace that error, but it should not vanish silently either
            log.warn("Could not clean up the partial attachment file {}", target, ex);
        }
    }
}
