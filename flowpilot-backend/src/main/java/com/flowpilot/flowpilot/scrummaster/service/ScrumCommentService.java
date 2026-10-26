package com.flowpilot.flowpilot.scrummaster.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.scrummaster.dto.ScrumCommentDto;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumValidationException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumComment;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumCommentRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;

/** Task discussion (SRS Module 4: "Comments" field, "Comment" action). */
@Service
public class ScrumCommentService {

    private static final int MAX_BODY = 4000;

    private final ScrumCommentRepository commentRepository;
    private final ScrumTaskRepository taskRepository;
    private final UserRepository userRepository;

    public ScrumCommentService(
            ScrumCommentRepository commentRepository,
            ScrumTaskRepository taskRepository,
            UserRepository userRepository
    ) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }


    public List<ScrumCommentDto.Comment> listForTask(Long taskId) {

        requireTask(taskId);

        List<ScrumCommentDto.Comment> out = new ArrayList<>();

        for (ScrumComment comment : commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)) {
            out.add(toDto(comment));
        }

        return out;
    }


    @Transactional
    public ScrumCommentDto.Comment add(Long taskId, ScrumCommentDto.CreateRequest request) {

        requireTask(taskId);

        if (request == null) {
            throw new ScrumValidationException("Comment details are required");
        }

        String body = validBody(request.body());

        ScrumComment comment = new ScrumComment();
        comment.setTaskId(taskId);
        comment.setBody(body);

        if (request.authorId() != null) {
            comment.setAuthor(requireUser(request.authorId()));
        }

        return toDto(commentRepository.save(comment));
    }


    @Transactional
    @SuppressWarnings("null")
    public ScrumCommentDto.Comment edit(Long commentId, ScrumCommentDto.UpdateRequest request) {

        if (request == null) {
            throw new ScrumValidationException("Nothing to update");
        }

        ScrumComment comment = commentRepository
                .findById(commentId)
                .orElseThrow(() -> new ScrumNotFoundException("Comment not found: " + commentId));

        String body = validBody(request.body());

        // Only stamp editedAt when the text actually changed, so a no-op save
        // does not make an untouched comment look rewritten.
        if (!body.equals(comment.getBody())) {
            comment.setBody(body);
            comment.setEditedAt(LocalDateTime.now());
        }

        return toDto(commentRepository.save(comment));
    }


    @Transactional
    @SuppressWarnings("null")
    public void delete(Long commentId) {

        ScrumComment comment = commentRepository
                .findById(commentId)
                .orElseThrow(() -> new ScrumNotFoundException("Comment not found: " + commentId));

        commentRepository.delete(comment);
    }


    /** Comment count per task, so a card can show a thread indicator. */
    public long countForTask(Long taskId) {
        return commentRepository.countByTaskId(taskId);
    }


    private String validBody(String raw) {

        if (raw == null || raw.isBlank()) {
            throw new ScrumValidationException("A comment cannot be empty");
        }

        String body = raw.trim();

        if (body.length() > MAX_BODY) {
            throw new ScrumValidationException(
                    "A comment cannot be longer than " + MAX_BODY + " characters"
            );
        }

        return body;
    }

    @SuppressWarnings("null")
    private void requireTask(Long taskId) {

        if (!taskRepository.existsById(taskId)) {
            throw new ScrumNotFoundException("Task not found: " + taskId);
        }
    }

    @SuppressWarnings("null")
    private User requireUser(Long userId) {

        return userRepository
                .findById(userId)
                .orElseThrow(() -> new ScrumNotFoundException("User not found: " + userId));
    }

    private ScrumCommentDto.Comment toDto(ScrumComment comment) {

        return new ScrumCommentDto.Comment(
                comment.getId(),
                comment.getTaskId(),
                comment.getAuthor() == null ? null : comment.getAuthor().getId(),
                comment.getAuthorName(),
                comment.getAuthorInitials(),
                comment.getBody(),
                comment.getCreatedAt(),
                comment.getEditedAt(),
                comment.getEditedAt() != null
        );
    }
}
