package com.flowpilot.flowpilot.scrummaster.dto;

import java.util.List;

/** Task dependency payloads (SRS Module 4: "Dependencies"). */
public class ScrumDependencyDto {

    /** One end of a dependency, with enough detail to render a chip. */
    public record Link(
            Long id,
            Long taskId,
            String taskKey,
            String title,
            String status,
            boolean done,
            String kind
    ) {}

    public record Response(
            Long taskId,
            String taskKey,
            /** Tasks this one is waiting on. */
            List<Link> blockedBy,
            /** Tasks waiting on this one. */
            List<Link> blocking,
            /** True when something it waits on is still unfinished. */
            boolean waiting,
            Integer unresolvedCount
    ) {}

    public record CreateRequest(
            Long dependsOnTaskId,
            String kind
    ) {}
}
