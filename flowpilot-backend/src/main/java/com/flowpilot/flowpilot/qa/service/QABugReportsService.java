package com.flowpilot.flowpilot.qa.service;

import com.flowpilot.flowpilot.qa.dto.QABugReplyDto;
import com.flowpilot.flowpilot.qa.model.QABugReply;
import com.flowpilot.flowpilot.qa.model.QABugReport;
import com.flowpilot.flowpilot.qa.repository.QABugReplyRepository;
import com.flowpilot.flowpilot.qa.repository.QABugRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class QABugReportsService {

    private final QABugRepository bugRepository;
    private final QABugReplyRepository bugReplyRepository;

    public QABugReportsService(QABugRepository bugRepository, QABugReplyRepository bugReplyRepository) {
        this.bugRepository = bugRepository;
        this.bugReplyRepository = bugReplyRepository;
    }

    public List<QABugReplyDto> getReplies(Long bugReportId) {
        return bugReplyRepository.findByQaBugReportIdOrderByCreatedAtAsc(bugReportId)
                .stream()
                .map(this::toReplyDto)
                .toList();
    }

    @Transactional
    public QABugReplyDto addReply(Long bugReportId, String senderName, String senderRole, String message) {
        QABugReport bug = bugRepository.findById(bugReportId)
                .orElseThrow(() -> new RuntimeException("Bug report not found with id: " + bugReportId));

        QABugReply reply = QABugReply.builder()
                .qaBugReportId(bug.getId())
                .bugId(bug.getBugId())
                .senderName(senderName != null && !senderName.isBlank() ? senderName : "QA Engineer")
                .senderRole(senderRole != null && !senderRole.isBlank() ? senderRole : "QA_ENGINEER")
                .message(message != null ? message.trim() : "")
                .createdAt(LocalDateTime.now())
                .build();

        QABugReply saved = bugReplyRepository.save(reply);
        return toReplyDto(saved);
    }

    private QABugReplyDto toReplyDto(QABugReply reply) {
        return QABugReplyDto.builder()
                .id(reply.getId())
                .bugId(reply.getBugId())
                .qaBugReportId(reply.getQaBugReportId())
                .senderName(reply.getSenderName())
                .senderRole(reply.getSenderRole())
                .message(reply.getMessage())
                .createdAt(reply.getCreatedAt())
                .time(getRelativeTime(reply.getCreatedAt()))
                .build();
    }

    private String getRelativeTime(LocalDateTime createdAt) {
        if (createdAt == null) {
            return "Just now";
        }
        Duration duration = Duration.between(createdAt, LocalDateTime.now());
        long minutes = duration.toMinutes();
        if (minutes < 1) {
            return "Just now";
        }
        if (minutes < 60) {
            return minutes + "m ago";
        }
        long hours = duration.toHours();
        if (hours < 24) {
            return hours + "h ago";
        }
        long days = duration.toDays();
        if (days < 7) {
            return days + "d ago";
        }
        return createdAt.toLocalDate().toString();
    }

    /*
     * =========================================================
     * GET ALL BUGS
     * =========================================================
     */
    @Transactional(readOnly = true)
    public List<QABugReport> getAllBugs() {

        return bugRepository.findAll();
    }

    /*
     * =========================================================
     * GET BUGS CREATED BY A PARTICULAR QA USER
     * =========================================================
     */
    @Transactional(readOnly = true)
    public List<QABugReport> getBugsCreatedBy(
            String createdBy) {

        if (createdBy == null ||
                createdBy.trim().isEmpty()) {

            return List.of();
        }

        return bugRepository
                .findByCreatedByIgnoreCase(
                        createdBy.trim()
                );
    }

    /*
     * =========================================================
     * CREATE BUG
     * =========================================================
     */
    @Transactional
    public QABugReport createBug(
            QABugReport bug) {

        if (bug == null) {

            throw new IllegalArgumentException(
                    "Bug report cannot be null"
            );
        }

        if (bug.getBugId() == null ||
                bug.getBugId().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Bug ID is required"
            );
        }

        if (bug.getTitle() == null ||
                bug.getTitle().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Bug title is required"
            );
        }

        if (bug.getSeverity() == null ||
                bug.getSeverity().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Bug severity is required"
            );
        }

        if (bug.getCreatedBy() == null ||
                bug.getCreatedBy().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Bug creator is required"
            );
        }

        String bugId =
                bug.getBugId().trim();

        if (bugRepository
                .existsByBugId(bugId)) {

            throw new IllegalArgumentException(
                    "Bug ID already exists: " +
                            bugId
            );
        }

        bug.setId(null);

        bug.setBugId(
                bugId
        );

        bug.setTitle(
                bug.getTitle().trim()
        );

        bug.setCreatedBy(
                bug.getCreatedBy().trim()
        );

        if (bug.getAssignedTo() != null) {

            bug.setAssignedTo(
                    bug.getAssignedTo().trim()
            );
        }

        if (bug.getLinkedTaskId() != null) {

            bug.setLinkedTaskId(
                    bug.getLinkedTaskId().trim()
            );
        }

        if (bug.getEnvironment() != null) {

            bug.setEnvironment(
                    bug.getEnvironment().trim()
            );
        }

        if (bug.getSeverity() != null) {

            bug.setSeverity(
                    bug.getSeverity().trim()
            );
        }

        if (bug.getStatus() == null ||
                bug.getStatus().isBlank()) {

            bug.setStatus("Open");

        } else {

            bug.setStatus(
                    bug.getStatus().trim()
            );
        }

        return bugRepository.save(bug);
    }
}
