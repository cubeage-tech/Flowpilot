package com.flowpilot.flowpilot.scrummaster.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.scrummaster.dto.ScrumAttachmentDto;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumValidationException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumAttachment;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumAttachmentRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;

/** Task files (SRS Module 4: "Attachments" field, "Attach Files" action). */
@Service
public class ScrumAttachmentService {

    /** 10 MB. Stated in the rejection message so a client can act on it. */
    private static final long MAX_BYTES = 10L * 1024 * 1024;

    private static final int MAX_NAME = 255;

    private static final String DOWNLOAD_PATH = "/api/scrummaster/attachments/";

    private final ScrumAttachmentRepository attachmentRepository;
    private final ScrumTaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ScrumFileStore fileStore;

    public ScrumAttachmentService(
            ScrumAttachmentRepository attachmentRepository,
            ScrumTaskRepository taskRepository,
            UserRepository userRepository,
            ScrumFileStore fileStore
    ) {
        this.attachmentRepository = attachmentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.fileStore = fileStore;
    }


    /**
     * Everything the download endpoint needs, carried out of the service in
     * one piece. Not a JSON payload — it never leaves the controller as a
     * body — so it lives here rather than in the DTO class.
     */
    public record StoredFile(
            String fileName,
            String contentType,
            long sizeBytes,
            Resource resource
    ) {}


    public List<ScrumAttachmentDto.Attachment> listForTask(Long taskId) {

        requireTask(taskId);

        List<ScrumAttachmentDto.Attachment> out = new ArrayList<>();

        for (ScrumAttachment attachment
                : attachmentRepository.findByTaskIdOrderByUploadedAtAsc(taskId)) {
            out.add(toDto(attachment));
        }

        return out;
    }


    @Transactional
    public ScrumAttachmentDto.Attachment upload(
            Long taskId,
            MultipartFile file,
            Long uploadedById
    ) {

        requireTask(taskId);

        if (file == null || file.isEmpty()) {
            throw new ScrumValidationException("An empty file cannot be attached");
        }

        if (file.getSize() > MAX_BYTES) {
            throw new ScrumValidationException(
                    "That file is too large. An attachment cannot be larger than "
                            + (MAX_BYTES / (1024 * 1024)) + " MB");
        }

        String fileName = displayName(file.getOriginalFilename());

        // Every check that can still refuse this upload runs before a single
        // byte is written, so a rejection cannot leave a file behind that no
        // row will ever point at
        User uploader = uploadedById == null ? null : requireUser(uploadedById);

        String storageKey;

        try (InputStream data = file.getInputStream()) {
            storageKey = fileStore.store(data, fileName);
        } catch (IOException ex) {
            // Unchecked, so the module's handler logs the cause and answers
            // 500 instead of this being swallowed into an empty response
            throw new UncheckedIOException(
                    "Could not read the uploaded file for task " + taskId, ex);
        }

        try {
            ScrumAttachment attachment = new ScrumAttachment();
            attachment.setTaskId(taskId);
            attachment.setFileName(fileName);
            attachment.setContentType(cleanContentType(file.getContentType()));
            attachment.setStorageKey(storageKey);
            attachment.setUploadedBy(uploader);

            // The bytes on disk, not the client's claim about them
            attachment.setSizeBytes(fileStore.size(storageKey));

            return toDto(attachmentRepository.save(attachment));
        } catch (RuntimeException ex) {
            // The row is rolling back, so the file it would have pointed at is
            // unreachable; drop it rather than leak an orphan
            fileStore.delete(storageKey);
            throw ex;
        }
    }


    public StoredFile download(Long attachmentId) {

        ScrumAttachment attachment = requireAttachment(attachmentId);

        return new StoredFile(
                attachment.getFileName(),
                attachment.getContentType(),
                attachment.getSizeBytes() == null ? 0L : attachment.getSizeBytes(),
                fileStore.load(attachment.getStorageKey())
        );
    }


    @Transactional
    public String delete(Long attachmentId) {

        ScrumAttachment attachment = requireAttachment(attachmentId);
        String fileName = attachment.getFileName();

        attachmentRepository.delete(attachment);

        // After the row, so a storage failure rolls the delete back and leaves
        // metadata and bytes agreeing with each other
        fileStore.delete(attachment.getStorageKey());

        return fileName;
    }


    /**
     * Removes every attachment of a task, bytes included. Exists because
     * deleting a task must not leave files on disk that nothing can reach any
     * more; call it from the task delete path.
     */
    @Transactional
    public void deleteForTask(Long taskId) {

        List<ScrumAttachment> attachments =
                attachmentRepository.findByTaskIdOrderByUploadedAtAsc(taskId);

        attachmentRepository.deleteAll(attachments);

        for (ScrumAttachment attachment : attachments) {
            fileStore.delete(attachment.getStorageKey());
        }
    }


    /** Attachment count per task, so a card can show a paperclip. */
    public long countForTask(Long taskId) {
        return attachmentRepository.countByTaskId(taskId);
    }


    /**
     * The name to show and to send back in Content-Disposition.
     *
     * Reduced to a base name because some browsers send a full path in the
     * multipart headers, and stripped of control characters because those would
     * travel into a response header.
     */
    private String displayName(String rawName) {

        if (rawName == null || rawName.isBlank()) {
            throw new ScrumValidationException("That file has no name");
        }

        String name = rawName.trim();

        int slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (slash >= 0) {
            name = name.substring(slash + 1);
        }

        name = name.replaceAll("[\\p{Cntrl}]", "").trim();

        if (name.isEmpty() || name.equals(".") || name.equals("..")) {
            throw new ScrumValidationException("That file has no usable name");
        }

        return name.length() > MAX_NAME ? name.substring(0, MAX_NAME) : name;
    }


    /** A blank browser-supplied type is stored as absent, not as "". */
    private String cleanContentType(String rawType) {

        if (rawType == null || rawType.isBlank()) {
            return null;
        }

        String type = rawType.trim();

        return type.length() > 128 ? type.substring(0, 128) : type;
    }


    private void requireTask(Long taskId) {

        if (!taskRepository.existsById(taskId)) {
            throw new ScrumNotFoundException("Task not found: " + taskId);
        }
    }

    private ScrumAttachment requireAttachment(Long attachmentId) {

        return attachmentRepository
                .findById(attachmentId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Attachment not found: " + attachmentId));
    }

    private User requireUser(Long userId) {

        return userRepository
                .findById(userId)
                .orElseThrow(() -> new ScrumNotFoundException("User not found: " + userId));
    }

    private ScrumAttachmentDto.Attachment toDto(ScrumAttachment attachment) {

        return new ScrumAttachmentDto.Attachment(
                attachment.getId(),
                attachment.getTaskId(),
                attachment.getFileName(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                attachment.getUploadedBy() == null
                        ? null
                        : attachment.getUploadedBy().getId(),
                attachment.getUploadedByName(),
                attachment.getUploadedByInitials(),
                attachment.getUploadedAt(),
                DOWNLOAD_PATH + attachment.getId() + "/download"
        );
    }
}
