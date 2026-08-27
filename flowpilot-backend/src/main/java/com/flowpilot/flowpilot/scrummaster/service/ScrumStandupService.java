package com.flowpilot.flowpilot.scrummaster.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.scrummaster.dto.ScrumStandupDto;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumValidationException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;
import com.flowpilot.flowpilot.scrummaster.model.ScrumStandup;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSprintRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumStandupRepository;

/**
 * The daily standup: one entry per member, per day, per sprint.
 *
 * A day's standup is read as a whole rather than per member, because the value
 * of the screen is the comparison — who is blocked, who has not spoken yet.
 */
@Service
public class ScrumStandupService {

    /**
     * A save is an upsert, so the endpoint cannot tell from the entry alone
     * whether it created or replaced; this carries that answer out with it.
     */
    public record SaveResult(
            ScrumStandupDto.Entry entry,
            boolean created
    ) {}

    private final ScrumStandupRepository standupRepository;
    private final ScrumSprintRepository sprintRepository;
    private final UserRepository userRepository;
    private final ScrumTaskService taskService;


    public ScrumStandupService(
            ScrumStandupRepository standupRepository,
            ScrumSprintRepository sprintRepository,
            UserRepository userRepository,
            ScrumTaskService taskService
    ) {
        this.standupRepository = standupRepository;
        this.sprintRepository = sprintRepository;
        this.userRepository = userRepository;
        this.taskService = taskService;
    }


    // ============================================
    // READ ONE DAY'S STANDUP
    // ============================================

    /**
     * One day of standup for a sprint, defaulting to the active sprint and to
     * today — the case the team opens every morning.
     */
    // Read-only transaction: the entries, the recorded dates and the member
    // list are three queries that must describe the same moment
    @Transactional(readOnly = true)
    public ScrumStandupDto.Response getStandup(Long sprintId, LocalDate date) {

        ScrumSprint sprint = resolveSprint(sprintId);

        // "Today" has to be the sprint's today, not the JVM host's: on a
        // server in another zone the morning standup opens on a date the sprint
        // does not consider today, so it reads as empty while the entries sit
        // under the real one
        LocalDate standupDate = date == null ? ScrumWorkingDays.today() : date;

        List<ScrumStandup> standups =
                standupRepository.findBySprintIdAndStandupDateOrderByIdAsc(
                        sprint.getId(), standupDate);

        List<ScrumStandupDto.Entry> entries = new ArrayList<>(standups.size());

        int blockedCount = 0;

        for (ScrumStandup standup : standups) {

            entries.add(toEntry(standup));

            if (standup.isBlocked()) {
                blockedCount++;
            }
        }

        return new ScrumStandupDto.Response(
                sprint.getId(),
                sprint.getName(),
                standupDate,
                // An entry is the record that someone stood up, so the count of
                // entries is the attendance for that day
                entries.size(),
                blockedCount,
                standupRepository.findDatesForSprint(sprint.getId()),
                // The whole team, not only those who have spoken: the client
                // needs the silent ones to offer "add an entry" for them
                taskService.listMembers(),
                entries
        );
    }


    // ============================================
    // CREATE OR REPLACE ONE MEMBER'S ENTRY
    // ============================================

    /**
     * Upserts one member's entry for one day. People correct what they said
     * minutes after saying it, so a second save replaces the first rather than
     * colliding with the entity's sprint + member + date unique constraint.
     */
    @Transactional
    public SaveResult saveStandup(
            Long sprintId,
            ScrumStandupDto.SaveRequest request
    ) {

        if (request == null) {
            throw new ScrumValidationException("Standup details are required.");
        }

        if (request.memberId() == null) {
            throw new ScrumValidationException(
                    "A standup entry must name the member it belongs to.");
        }

        ScrumSprint sprint = resolveSprint(sprintId);

        User member = userRepository.findById(request.memberId())
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Member " + request.memberId() + " was not found."));

        // Same clock as the read path. Any other and a save with no date given
        // lands on a different day than the screen it was typed into, so the
        // entry disappears from the standup that created it
        LocalDate standupDate = request.standupDate() == null
                ? ScrumWorkingDays.today()
                : request.standupDate();

        String yesterday = trimToNull(request.yesterday());
        String today = trimToNull(request.today());
        String blocker = trimToNull(request.blocker());

        // An entry with nothing in it says nothing about the member's day yet
        // still counts towards attendance, which would overstate the standup
        if (yesterday == null && today == null && blocker == null) {
            throw new ScrumValidationException(
                    "A standup entry needs at least one of yesterday, "
                            + "today or blocker.");
        }

        ScrumStandup standup = standupRepository
                .findBySprintIdAndMemberIdAndStandupDate(
                        sprint.getId(), member.getId(), standupDate)
                .orElse(null);

        boolean created = standup == null;

        if (created) {

            standup = new ScrumStandup();

            standup.setSprintId(sprint.getId());
            standup.setMember(member);
            standup.setStandupDate(standupDate);

        } else {
            // Stamped in the module's zone too, so an edit's timestamp cannot
            // date from a different day than the entry it belongs to
            standup.setUpdatedAt(LocalDateTime.now(ScrumWorkingDays.ZONE));
        }

        // Blank is stored as null so ScrumStandup.isBlocked stays the single
        // rule for "this person is blocked"
        standup.setYesterday(yesterday);
        standup.setToday(today);
        standup.setBlocker(blocker);

        return new SaveResult(
                toEntry(standupRepository.save(standup)),
                created
        );
    }


    // ============================================
    // DELETE ONE ENTRY
    // ============================================

    /** Removes one entry and hands back what was removed. */
    @Transactional
    public ScrumStandupDto.Entry deleteStandup(Long standupId) {

        if (standupId == null) {
            throw new ScrumValidationException("Standup id is required.");
        }

        ScrumStandup standup = standupRepository.findById(standupId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Standup entry " + standupId + " was not found."));

        // Mapped before the delete, while the entity is still readable
        ScrumStandupDto.Entry removed = toEntry(standup);

        standupRepository.delete(standup);

        return removed;
    }


    // ============================================
    // INTERNAL HELPERS
    // ============================================

    private ScrumStandupDto.Entry toEntry(ScrumStandup standup) {

        User member = standup.getMember();

        return new ScrumStandupDto.Entry(
                standup.getId(),
                member == null ? null : member.getId(),
                standup.getMemberName(),
                standup.getMemberInitials(),
                standup.getMemberRole(),
                standup.getStandupDate(),
                standup.getYesterday(),
                standup.getToday(),
                standup.getBlocker(),
                standup.isBlocked()
        );
    }


    /** An explicit sprint wins; otherwise the standup is the active sprint's. */
    private ScrumSprint resolveSprint(Long sprintId) {

        if (sprintId != null) {

            return sprintRepository.findById(sprintId)
                    .orElseThrow(() -> new ScrumNotFoundException(
                            "Sprint " + sprintId + " was not found."));
        }

        return sprintRepository.findFirstByStatus(ScrumSprint.Status.ACTIVE)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "No active sprint. Create one and start it."));
    }


    private static String trimToNull(String raw) {

        if (raw == null) {
            return null;
        }

        String value = raw.trim();

        return value.isEmpty() ? null : value;
    }
}
