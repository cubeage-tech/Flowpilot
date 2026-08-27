package com.flowpilot.flowpilot.scrummaster.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumTaskDto;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSprintRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;

/**
 * Sprint Overview: the one screen a scrum master opens first.
 *
 * It answers three questions — where is the sprint, what needs unblocking
 * today, and what is happening next — by composing the sprint and analytics
 * services rather than recalculating anything itself.
 */
@Service
public class ScrumMasterDashboardService {

    private static final DateTimeFormatter DAY_MONTH = DateTimeFormatter.ofPattern("MMM d");

    /** A card idle this long is worth a scrum master's attention. */
    private static final int STUCK_AFTER_DAYS = 3;

    private final ScrumSprintRepository sprintRepository;
    private final ScrumTaskRepository taskRepository;
    private final ScrumSprintService sprintService;
    private final ScrumTaskService taskService;
    private final ScrumAnalyticsService analyticsService;

    public ScrumMasterDashboardService(
            ScrumSprintRepository sprintRepository,
            ScrumTaskRepository taskRepository,
            ScrumSprintService sprintService,
            ScrumTaskService taskService,
            ScrumAnalyticsService analyticsService
    ) {
        this.sprintRepository = sprintRepository;
        this.taskRepository = taskRepository;
        this.sprintService = sprintService;
        this.taskService = taskService;
        this.analyticsService = analyticsService;
    }


    public Map<String, Object> getDashboard() {

        ScrumSprint sprint = sprintRepository
                .findFirstByStatus(ScrumSprint.Status.ACTIVE)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "No active sprint. Create one and start it."));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sprint", sprintService.toResponse(sprint));
        payload.put("kpis", analyticsService.buildKpis(sprint));
        payload.put("ceremonies", ceremonies(sprint));
        payload.put("stuckTasks", stuckTasks(sprint));

        return payload;
    }


    /**
     * Cards that have not moved in days. Done work is excluded because a
     * finished task is not stuck, and backlog items are excluded because they
     * are not meant to be moving yet.
     */
    private List<ScrumTaskDto.Card> stuckTasks(ScrumSprint sprint) {

        List<ScrumTaskDto.Card> stuck = new ArrayList<>();

        for (ScrumTask task : taskRepository
                .findBySprintIdOrderByStatusAscTaskKeyAsc(sprint.getId())) {

            boolean idle = task.getDaysInColumn() >= STUCK_AFTER_DAYS;
            boolean shouldBeMoving = task.getStatus() != ScrumTask.Status.DONE
                    && task.getStatus() != ScrumTask.Status.BACKLOG;

            if (idle && shouldBeMoving) {
                stuck.add(taskService.toCard(task));
            }
        }

        return stuck;
    }


    /**
     * Ceremonies follow a fixed cadence, so they are derived from the sprint
     * window rather than stored: standup daily, review on the working day
     * before the close, retro at the close, next planning the working day
     * after.
     *
     * Both steps are working-day arithmetic, like every other date in this
     * module. Raw calendar arithmetic scheduled a Friday-ending sprint's next
     * planning on the Saturday, and a Monday-ending sprint's review on the
     * Sunday — days nobody is in the office for.
     */
    private List<Map<String, String>> ceremonies(ScrumSprint sprint) {

        List<Map<String, String>> list = new ArrayList<>();

        list.add(ceremony("Daily standup", "9:30 AM — every working day", "done"));

        if (sprint.getEndDate() != null) {

            list.add(ceremony(
                    "Sprint review",
                    previousWorkingDay(sprint.getEndDate()).format(DAY_MONTH)
                            + " · 3:00 PM",
                    "plan"
            ));

            list.add(ceremony(
                    "Retrospective",
                    sprint.getEndDate().format(DAY_MONTH) + " · 10:00 AM",
                    "test"
            ));

            // plusWorkingDays counts its own start as day 1, so day 2 is the
            // first working day after the sprint closes
            list.add(ceremony(
                    "Next sprint planning",
                    ScrumWorkingDays.plusWorkingDays(sprint.getEndDate(), 2)
                            .format(DAY_MONTH) + " · 9:00 AM",
                    "active"
            ));
        }

        return list;
    }

    /**
     * The working day before `date`. Stepping back one calendar day is not
     * enough on its own: from a Monday that lands on the Sunday, and from a
     * Sunday on the Saturday. At most two extra steps are ever needed.
     */
    private LocalDate previousWorkingDay(LocalDate date) {

        LocalDate previous = date.minusDays(1);

        while (previous.getDayOfWeek() == DayOfWeek.SATURDAY
                || previous.getDayOfWeek() == DayOfWeek.SUNDAY) {

            previous = previous.minusDays(1);
        }

        return previous;
    }

    private Map<String, String> ceremony(String name, String when, String tone) {

        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("name", name);
        entry.put("when", when);
        entry.put("tone", tone);

        return entry;
    }
}
