package com.flowpilot.flowpilot.developer.service;

import com.flowpilot.flowpilot.developer.dto.DeveloperMentionDto;
import com.flowpilot.flowpilot.pm.model.PMProject;
import com.flowpilot.flowpilot.pm.repository.PMProjectsRepository;
import com.flowpilot.flowpilot.qa.dto.QABugReplyDto;
import com.flowpilot.flowpilot.qa.model.QABugReply;
import com.flowpilot.flowpilot.qa.model.QABugReport;
import com.flowpilot.flowpilot.qa.repository.QABugReplyRepository;
import com.flowpilot.flowpilot.qa.repository.QABugRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DeveloperMentionsService {

    private final QABugRepository qaBugRepository;
    private final QABugReplyRepository bugReplyRepository;
    private final PMProjectsRepository projectsRepository;

    @SuppressWarnings("null")
    public List<DeveloperMentionDto> getAllMentions() {

        return qaBugRepository.findAll()
                .stream()
                .sorted(
                        Comparator.comparing(
                                QABugReport::getCreatedAt,
                                Comparator.nullsLast(
                                        Comparator.reverseOrder()
                                )
                        )
                )
                .map(this::convertBugToMention)
                .toList();
    }

    public QABugReplyDto addReply(Long bugReportId, String senderName, String senderRole, String message) {
        QABugReport bug = qaBugRepository.findById(bugReportId)
                .orElseThrow(() -> new RuntimeException("Bug report not found with id: " + bugReportId));

        QABugReply reply = QABugReply.builder()
                .qaBugReportId(bug.getId())
                .bugId(bug.getBugId())
                .senderName(senderName != null && !senderName.isBlank() ? senderName : "Developer")
                .senderRole(senderRole != null && !senderRole.isBlank() ? senderRole : "DEVELOPER")
                .message(message != null ? message.trim() : "")
                .createdAt(LocalDateTime.now())
                .build();

        QABugReply saved = bugReplyRepository.save(reply);

        return toReplyDto(saved);
    }

    public List<QABugReplyDto> getRepliesForBug(Long bugReportId) {
        return bugReplyRepository.findByQaBugReportIdOrderByCreatedAtAsc(bugReportId)
                .stream()
                .map(this::toReplyDto)
                .toList();
    }

    public List<QABugReplyDto> getRepliesByBugCode(String bugId) {
        return bugReplyRepository.findByBugIdOrderByCreatedAtAsc(bugId)
                .stream()
                .map(this::toReplyDto)
                .toList();
    }

    private DeveloperMentionDto convertBugToMention(
            QABugReport bug
    ) {
        String task = bug.getLinkedTaskId();
        if (task == null || task.isBlank()) {
            task = bug.getBugId();
        }

        String projectName = "General Project";
        if (bug.getProjectId() != null) {
            Optional<PMProject> pOpt = projectsRepository.findById(bug.getProjectId());
            if (pOpt.isPresent()) {
                PMProject p = pOpt.get();
                projectName = p.getProjectCode() + " - " + p.getProjectName();
            }
        }

        List<QABugReplyDto> replies = bugReplyRepository.findByQaBugReportIdOrderByCreatedAtAsc(bug.getId())
                .stream()
                .map(this::toReplyDto)
                .toList();

        String initials = "QA";
        String createdByName = bug.getCreatedBy();
        if (createdByName != null && !createdByName.isBlank()) {
            String[] parts = createdByName.trim().split("\\s+");
            if (parts.length >= 2) {
                initials = ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
            } else if (parts[0].length() >= 2) {
                initials = parts[0].substring(0, 2).toUpperCase();
            }
        }

        return DeveloperMentionDto.builder()
                .id(bug.getId())
                .initials(initials)
                .name(createdByName != null && !createdByName.isBlank() ? createdByName : "QA Team")
                .task(task)
                .message(buildMessage(bug))
                .time(getRelativeTime(bug.getCreatedAt()))
                .unread(true)
                .bugId(bug.getBugId())
                .title(bug.getTitle())
                .projectId(bug.getProjectId())
                .projectName(projectName)
                .linkedTaskId(bug.getLinkedTaskId())
                .environment(bug.getEnvironment())
                .severity(bug.getSeverity())
                .assignedTo(bug.getAssignedTo())
                .createdBy(bug.getCreatedBy())
                .stepsToReproduce(bug.getStepsToReproduce())
                .screenshot(bug.getScreenshot())
                .status(bug.getStatus())
                .createdAt(bug.getCreatedAt())
                .replies(replies)
                .build();
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

    private String buildMessage(QABugReport bug) {
        String assignedTo = "";
        if (bug.getAssignedTo() != null && !bug.getAssignedTo().isBlank()) {
            assignedTo = "@" + bug.getAssignedTo() + " ";
        }
        String description = bug.getTitle();
        if (bug.getStepsToReproduce() != null && !bug.getStepsToReproduce().isBlank()) {
            description = bug.getStepsToReproduce();
        }
        return assignedTo + description + "\nBug ID: " + bug.getBugId();
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
}
