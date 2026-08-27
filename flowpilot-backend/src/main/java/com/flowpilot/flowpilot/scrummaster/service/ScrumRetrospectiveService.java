package com.flowpilot.flowpilot.scrummaster.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.scrummaster.dto.ScrumRetrospectiveDto;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumValidationException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumRetrospective;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSprint;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumRetrospectiveRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSprintRepository;

/**
 * The sprint retrospective: what went well, what to change, and the actions the
 * team commits to as a result.
 *
 * Every operation accepts an explicit sprint id, including the writes. A retro
 * is normally held after the sprint has been closed, so restricting this to the
 * active sprint would make it impossible to write down the retro of the sprint
 * it is about.
 */
@Service
public class ScrumRetrospectiveService {

    /** Matches the dueLabel column, so an over-long label fails as a 400. */
    private static final int MAX_DUE_LABEL_LENGTH = 60;

    private final ScrumRetrospectiveRepository retrospectiveRepository;
    private final ScrumSprintRepository sprintRepository;
    private final UserRepository userRepository;
    private final ScrumTaskService taskService;


    public ScrumRetrospectiveService(
            ScrumRetrospectiveRepository retrospectiveRepository,
            ScrumSprintRepository sprintRepository,
            UserRepository userRepository,
            ScrumTaskService taskService
    ) {
        this.retrospectiveRepository = retrospectiveRepository;
        this.sprintRepository = sprintRepository;
        this.userRepository = userRepository;
        this.taskService = taskService;
    }


    // ============================================
    // READ THE RETROSPECTIVE
    // ============================================

    /** The whole retro board for one sprint, split into its three columns. */
    // Read-only transaction: the items and the member list must describe the
    // same moment, and the owner picker is read alongside them
    @Transactional(readOnly = true)
    public ScrumRetrospectiveDto.Response getRetrospective(Long sprintId) {

        ScrumSprint sprint = resolveSprint(sprintId);

        // One query, then split by kind: three round trips would only cost more
        // to arrive at the same three lists
        List<ScrumRetrospective> items =
                retrospectiveRepository.findBySprintIdOrderByKindAscIdAsc(
                        sprint.getId());

        List<ScrumRetrospectiveDto.Item> wentWell = new ArrayList<>();
        List<ScrumRetrospectiveDto.Item> toChange = new ArrayList<>();
        List<ScrumRetrospectiveDto.Item> actions = new ArrayList<>();

        for (ScrumRetrospective item : items) {

            ScrumRetrospectiveDto.Item mapped = toItem(item);

            switch (item.getKind()) {
                case WENT_WELL -> wentWell.add(mapped);
                case TO_CHANGE -> toChange.add(mapped);
                case ACTION -> actions.add(mapped);
            }
        }

        return new ScrumRetrospectiveDto.Response(
                sprint.getId(),
                sprint.getName(),
                sprint.getStatus() == null ? null : sprint.getStatus().name(),
                // The retro belongs to the end of the sprint; a sprint with no
                // end date yet has no date to show
                sprint.getEndDate(),
                wentWell,
                toChange,
                actions,
                taskService.listMembers()
        );
    }


    // ============================================
    // ADD AN ITEM
    // ============================================

    @Transactional
    public ScrumRetrospectiveDto.Item createItem(
            Long sprintId,
            ScrumRetrospectiveDto.CreateRequest request
    ) {

        if (request == null) {
            throw new ScrumValidationException(
                    "Retrospective item details are required.");
        }

        ScrumSprint sprint = resolveSprint(sprintId);

        ScrumRetrospective.Kind kind = parseKind(request.kind());

        ScrumRetrospective item = new ScrumRetrospective();

        item.setSprintId(sprint.getId());
        item.setKind(kind);
        item.setText(requireText(request.text()));
        item.setCompleted(Boolean.FALSE);

        if (request.ownerId() != null) {

            requireActionable(kind, "an owner");

            item.setOwner(requireUser(request.ownerId()));
        }

        String dueLabel = validDueLabel(request.dueLabel());

        // Normalised first: a client that sends every field would otherwise be
        // rejected for an empty due label it never filled in
        if (dueLabel != null || request.dueDate() != null) {

            requireActionable(kind, "a due date");

            item.setDueLabel(dueLabel);
            item.setDueDate(request.dueDate());
        }

        return toItem(retrospectiveRepository.save(item));
    }


    // ============================================
    // EDIT AN ITEM
    // ============================================

    /** Only the fields that were sent are changed. */
    @Transactional
    public ScrumRetrospectiveDto.Item updateItem(
            Long itemId,
            ScrumRetrospectiveDto.UpdateRequest request
    ) {

        if (request == null) {
            throw new ScrumValidationException(
                    "Retrospective item details are required.");
        }

        ScrumRetrospective item = requireItem(itemId);

        if (request.text() != null) {
            item.setText(requireText(request.text()));
        }

        // clearOwner is the explicit clear, so it beats any ownerId sent with
        // it. Dropping an owner is legal on every kind: only taking one on is
        // restricted to actions
        if (Boolean.TRUE.equals(request.clearOwner())) {

            item.setOwner(null);

        } else if (request.ownerId() != null) {

            requireActionable(item.getKind(), "an owner");

            item.setOwner(requireUser(request.ownerId()));
        }

        if (request.dueLabel() != null) {

            String dueLabel = validDueLabel(request.dueLabel());

            // A blank label is the caller emptying the field, which is a clear
            // rather than a value and so needs no kind check
            if (dueLabel != null) {
                requireActionable(item.getKind(), "a due date");
            }

            item.setDueLabel(dueLabel);
        }

        if (request.dueDate() != null) {

            requireActionable(item.getKind(), "a due date");

            item.setDueDate(request.dueDate());
        }

        if (request.completed() != null) {
            item.setCompleted(request.completed());
        }

        return toItem(retrospectiveRepository.save(item));
    }


    // ============================================
    // DELETE AN ITEM
    // ============================================

    /** Removes one item and hands back what was removed. */
    @Transactional
    public ScrumRetrospectiveDto.Item deleteItem(Long itemId) {

        ScrumRetrospective item = requireItem(itemId);

        // Mapped before the delete, while the entity is still readable
        ScrumRetrospectiveDto.Item removed = toItem(item);

        retrospectiveRepository.delete(item);

        return removed;
    }


    // ============================================
    // INTERNAL HELPERS
    // ============================================

    private ScrumRetrospectiveDto.Item toItem(ScrumRetrospective item) {

        User owner = item.getOwner();

        return new ScrumRetrospectiveDto.Item(
                item.getId(),
                item.getKind() == null ? null : item.getKind().name(),
                item.getText(),
                owner == null ? null : owner.getId(),
                item.getOwnerName(),
                // Null rather than the entity's "?" placeholder: an unowned
                // item should render no avatar at all
                owner == null ? null : item.getOwnerInitials(),
                item.getDueLabel(),
                item.getDueDate(),
                Boolean.TRUE.equals(item.getCompleted())
        );
    }


    /**
     * An explicit sprint wins and may be in any state, because a retro is
     * usually written up once the sprint it is about has been completed.
     */
    private ScrumSprint resolveSprint(Long sprintId) {

        if (sprintId != null) {

            return sprintRepository.findById(sprintId)
                    .orElseThrow(() -> new ScrumNotFoundException(
                            "Sprint " + sprintId + " was not found."));
        }

        return sprintRepository.findFirstByStatus(ScrumSprint.Status.ACTIVE)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "No active sprint. Name the sprint to retrospect on "
                                + "with sprintId."));
    }


    private ScrumRetrospective requireItem(Long itemId) {

        if (itemId == null) {
            throw new ScrumValidationException(
                    "Retrospective item id is required.");
        }

        return retrospectiveRepository.findById(itemId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Retrospective item " + itemId + " was not found."));
    }


    private User requireUser(Long ownerId) {

        return userRepository.findById(ownerId)
                .orElseThrow(() -> new ScrumNotFoundException(
                        "Owner " + ownerId + " was not found."));
    }


    private ScrumRetrospective.Kind parseKind(String raw) {

        String value = raw == null ? "" : raw.trim();

        for (ScrumRetrospective.Kind kind : ScrumRetrospective.Kind.values()) {

            if (kind.name().equalsIgnoreCase(value)) {
                return kind;
            }
        }

        throw new ScrumValidationException(
                "Unknown retrospective kind: " + raw
                        + ". Expected WENT_WELL, TO_CHANGE or ACTION.");
    }


    /**
     * Ownership and due dates belong to actions only. The other two kinds are
     * observations about the sprint that has already happened, and an
     * observation has nobody to chase and no date to hit.
     */
    private static void requireActionable(
            ScrumRetrospective.Kind kind,
            String what
    ) {

        if (kind != ScrumRetrospective.Kind.ACTION) {

            throw new ScrumValidationException(
                    "A " + kind.name() + " note cannot have " + what
                            + ". Only ACTION items are owned and due.");
        }
    }


    private static String requireText(String raw) {

        String text = raw == null ? "" : raw.trim();

        if (text.isEmpty()) {
            throw new ScrumValidationException(
                    "Retrospective text cannot be empty.");
        }

        return text;
    }


    private static String validDueLabel(String raw) {

        String label = trimToNull(raw);

        if (label != null && label.length() > MAX_DUE_LABEL_LENGTH) {

            throw new ScrumValidationException(
                    "Due label must be " + MAX_DUE_LABEL_LENGTH
                            + " characters or fewer.");
        }

        return label;
    }


    private static String trimToNull(String raw) {

        if (raw == null) {
            return null;
        }

        String value = raw.trim();

        return value.isEmpty() ? null : value;
    }
}
