package com.flowpilot.flowpilot.scrummaster.service;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumDependencyDto;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumValidationException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTaskDependency;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskDependencyRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;

/** Task dependencies (SRS Module 4 field "Dependencies"). */
@Service
public class ScrumDependencyService {

    private final ScrumTaskDependencyRepository dependencyRepository;
    private final ScrumTaskRepository taskRepository;

    public ScrumDependencyService(
            ScrumTaskDependencyRepository dependencyRepository,
            ScrumTaskRepository taskRepository
    ) {
        this.dependencyRepository = dependencyRepository;
        this.taskRepository = taskRepository;
    }


    /**
     * Both directions for one card. Public so the task and board services can
     * render the same chips without duplicating the traversal.
     */
    @Transactional(readOnly = true)
    public ScrumDependencyDto.Response forTask(Long taskId) {

        ScrumTask task = requireTask(taskId);

        List<ScrumTaskDependency> waitingOn = sorted(dependencyRepository.findByTaskId(taskId));
        List<ScrumTaskDependency> waitedOnBy =
                sorted(dependencyRepository.findByDependsOnTaskId(taskId));

        // Both directions are resolved in a single lookup: fetching per edge
        // cost a query for every chip on a busy card
        Map<Long, ScrumTask> referenced = referencedTasks(waitingOn, waitedOnBy);

        List<ScrumDependencyDto.Link> blockedBy = new ArrayList<>();
        int unresolved = 0;

        for (ScrumTaskDependency edge : waitingOn) {

            ScrumTask other = referenced.get(edge.getDependsOnTaskId());

            // The referenced task was deleted and the edge outlived it; showing
            // a chip with no key or title would just be a dead link
            if (other == null) {
                continue;
            }

            blockedBy.add(toLink(edge, other));

            // Only a hard block counts: a related card is context, not a
            // barrier, and counting it would flag work that is free to start
            if (edge.getKind() == ScrumTaskDependency.Kind.BLOCKED_BY && !other.isDone()) {
                unresolved++;
            }
        }

        List<ScrumDependencyDto.Link> blocking = new ArrayList<>();

        for (ScrumTaskDependency edge : waitedOnBy) {

            ScrumTask other = referenced.get(edge.getTaskId());

            if (other != null) {
                blocking.add(toLink(edge, other));
            }
        }

        return new ScrumDependencyDto.Response(
                task.getId(),
                task.getTaskKey(),
                blockedBy,
                blocking,
                unresolved > 0,
                unresolved
        );
    }


    /**
     * Whether anything this task waits on is still unfinished.
     *
     * The per-card check for a board of many cards, so it loads the blockers in
     * one batch and never builds the full response. A missing task is not an
     * error here: a card that cannot be found simply waits on nothing, and
     * throwing would take a whole board render down with it.
     */
    @Transactional(readOnly = true)
    public boolean isWaiting(Long taskId) {

        if (taskId == null) {
            return false;
        }

        Set<Long> blockerIds = new LinkedHashSet<>();

        for (ScrumTaskDependency edge : dependencyRepository.findByTaskId(taskId)) {
            if (edge.getKind() == ScrumTaskDependency.Kind.BLOCKED_BY) {
                blockerIds.add(edge.getDependsOnTaskId());
            }
        }

        if (blockerIds.isEmpty()) {
            return false;
        }

        for (ScrumTask blocker : taskRepository.findAllById(blockerIds)) {
            if (!blocker.isDone()) {
                return true;
            }
        }

        return false;
    }


    @Transactional
    public ScrumDependencyDto.Response link(
            Long taskId, ScrumDependencyDto.CreateRequest request) {

        if (request == null || request.dependsOnTaskId() == null) {
            throw new ScrumValidationException("The task to depend on is required");
        }

        // Checked before the lookups so the caller is told what is actually
        // wrong with the request rather than that the task does not exist
        if (taskId.equals(request.dependsOnTaskId())) {
            throw new ScrumValidationException(
                    "A task cannot depend on itself; pick a different task to wait on."
            );
        }

        ScrumTask task = requireTask(taskId);
        ScrumTask blocker = requireTask(request.dependsOnTaskId());

        ScrumTaskDependency.Kind kind = parseKind(request.kind());

        if (dependencyRepository.existsByTaskIdAndDependsOnTaskId(
                taskId, request.dependsOnTaskId())) {

            throw new ScrumValidationException(
                    "A link between " + task.getTaskKey() + " and " + blocker.getTaskKey()
                            + " is already recorded."
            );
        }

        // A cycle leaves every card in the loop permanently unstartable, and
        // nothing downstream can explain why, so it is refused rather than
        // stored. Only BLOCKED_BY edges can form one: a RELATES_TO link stops
        // no work, so a loop of them is harmless context.
        if (kind == ScrumTaskDependency.Kind.BLOCKED_BY
                && reachesThroughBlockers(request.dependsOnTaskId(), taskId)) {

            throw new ScrumValidationException(
                    "That would create a circular dependency: " + blocker.getTaskKey()
                            + " already waits on " + task.getTaskKey()
                            + ", directly or through a chain, so making "
                            + task.getTaskKey() + " wait on " + blocker.getTaskKey()
                            + " would leave both unable to start."
            );
        }

        ScrumTaskDependency edge = new ScrumTaskDependency(taskId, request.dependsOnTaskId());
        edge.setKind(kind);

        dependencyRepository.save(edge);

        return forTask(taskId);
    }


    /**
     * Removes one edge by its own row id. Either end of the link may delete it,
     * so no task has to be named.
     */
    @Transactional
    public void unlink(Long linkId) {

        dependencyRepository.delete(requireLink(linkId));
    }


    /**
     * Removes an edge from a named card and answers with that card's refreshed
     * dependencies.
     *
     * Kept alongside the id-only form because a caller that names the card it
     * is editing gets a link id belonging to a different card refused, rather
     * than quietly deleting someone else's edge.
     */
    @Transactional
    public ScrumDependencyDto.Response unlink(Long taskId, Long linkId) {

        ScrumTaskDependency edge = requireLink(linkId);

        // Either end may remove the link, so the id is accepted from both sides
        if (!edge.getTaskId().equals(taskId) && !edge.getDependsOnTaskId().equals(taskId)) {
            throw new ScrumValidationException("That dependency does not involve this task");
        }

        dependencyRepository.delete(edge);

        return forTask(taskId);
    }


    /**
     * Walks the blocking chain out of {@code start}, following only the edges
     * that actually stop work, to see whether it reaches {@code target}.
     *
     * Breadth-first with a visited set, so a chain that somehow already holds a
     * cycle (rows written before this check existed, or straight into the
     * database) terminates instead of spinning the request forever.
     */
    private boolean reachesThroughBlockers(Long start, Long target) {

        Set<Long> seen = new HashSet<>();
        Deque<Long> pending = new ArrayDeque<>();

        pending.add(start);
        seen.add(start);

        while (!pending.isEmpty()) {

            Long current = pending.poll();

            if (current.equals(target)) {
                return true;
            }

            for (ScrumTaskDependency edge : dependencyRepository.findByTaskId(current)) {

                if (edge.getKind() != ScrumTaskDependency.Kind.BLOCKED_BY) {
                    continue;
                }

                Long next = edge.getDependsOnTaskId();

                if (seen.add(next)) {
                    pending.add(next);
                }
            }
        }

        return false;
    }


    /** Every task referred to by either side of the given edges, by id. */
    private Map<Long, ScrumTask> referencedTasks(
            List<ScrumTaskDependency> waitingOn, List<ScrumTaskDependency> waitedOnBy) {

        Set<Long> ids = new LinkedHashSet<>();

        for (ScrumTaskDependency edge : waitingOn) {
            ids.add(edge.getDependsOnTaskId());
        }

        for (ScrumTaskDependency edge : waitedOnBy) {
            ids.add(edge.getTaskId());
        }

        if (ids.isEmpty()) {
            return Map.of();
        }

        return taskRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(ScrumTask::getId, Function.identity()));
    }


    /** Oldest link first, so the chips do not reshuffle between reads. */
    private List<ScrumTaskDependency> sorted(List<ScrumTaskDependency> edges) {

        List<ScrumTaskDependency> copy = new ArrayList<>(edges);
        copy.sort(Comparator.comparing(ScrumTaskDependency::getId));

        return copy;
    }

    /**
     * Note which id goes where: {@code id} is the link row's own id, which is
     * what the client deletes, while {@code taskId} is the task at the other
     * end. Sending the task id as both would make the chip undeletable.
     */
    private ScrumDependencyDto.Link toLink(ScrumTaskDependency edge, ScrumTask other) {

        return new ScrumDependencyDto.Link(
                edge.getId(),
                other.getId(),
                other.getTaskKey(),
                other.getTitle(),
                other.getStatus().name(),
                other.isDone(),
                edge.getKind().name()
        );
    }

    private ScrumTaskDependency.Kind parseKind(String raw) {

        if (raw == null || raw.isBlank()) {
            return ScrumTaskDependency.Kind.BLOCKED_BY;
        }

        try {
            return ScrumTaskDependency.Kind.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ScrumValidationException("Unknown dependency kind: " + raw);
        }
    }

    private ScrumTask requireTask(Long taskId) {

        return taskRepository
                .findById(taskId)
                .orElseThrow(() -> new ScrumNotFoundException("Task not found: " + taskId));
    }

    private ScrumTaskDependency requireLink(Long linkId) {

        return dependencyRepository
                .findById(linkId)
                .orElseThrow(() -> new ScrumNotFoundException("Dependency not found: " + linkId));
    }
}
