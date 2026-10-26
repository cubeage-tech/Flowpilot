package com.flowpilot.flowpilot.scrummaster.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumAttachmentDto;
import com.flowpilot.flowpilot.scrummaster.service.ScrumAttachmentService;

@RestController
@RequestMapping("/api/scrummaster/attachments")
@CrossOrigin(origins = "http://localhost:5173")
public class ScrumAttachmentController {

    private final ScrumAttachmentService service;

    public ScrumAttachmentController(ScrumAttachmentService service) {
        this.service = service;
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<ScrumAttachmentDto.Attachment>> listForTask(
            @PathVariable Long taskId) {

        return ResponseEntity.ok(service.listForTask(taskId));
    }

    @PostMapping("/task/{taskId}")
    public ResponseEntity<ScrumAttachmentDto.Attachment> upload(
            @PathVariable Long taskId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(name = "uploadedById", required = false) Long uploadedById
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.upload(taskId, file, uploadedById));
    }

    /**
     * Always a download, never rendered in the tab: the bytes came from a user
     * upload, so an inline text/html attachment would run in our origin.
     */
    @GetMapping("/{attachmentId}/download")
    @SuppressWarnings("null")
    public ResponseEntity<Resource> download(@PathVariable Long attachmentId) {

        ScrumAttachmentService.StoredFile stored = service.download(attachmentId);

        ContentDisposition disposition = ContentDisposition
                .attachment()
                // UTF-8 form, so a name with an accent or a quote in it cannot
                // break the header it travels in
                .filename(stored.fileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity
                .ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(mediaType(stored.contentType()))
                .contentLength(stored.sizeBytes())
                .body(stored.resource());
    }

    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long attachmentId) {

        String fileName = service.delete(attachmentId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Deleted " + fileName
        ));
    }

    /** The stored type came from a browser, so it may not parse. */
    private static MediaType mediaType(String contentType) {

        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }

        try {
            return MediaType.parseMediaType(contentType);
        } catch (InvalidMediaTypeException ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
