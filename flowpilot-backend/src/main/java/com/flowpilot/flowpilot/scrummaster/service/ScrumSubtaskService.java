package com.flowpilot.flowpilot.scrummaster.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.scrummaster.dto.ScrumSubtaskDto;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumNotFoundException;
import com.flowpilot.flowpilot.scrummaster.exception.ScrumValidationException;
import com.flowpilot.flowpilot.scrummaster.model.ScrumSubtask;
import com.flowpilot.flowpilot.scrummaster.model.ScrumTask;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumSubtaskRepository;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumTaskRepository;

@Service
public class ScrumSubtaskService {

    private final ScrumSubtaskRepository subtaskRepository;
    private final ScrumTaskRepository taskRepository;
    private final UserRepository userRepository;

    public ScrumSubtaskService(
            ScrumSubtaskRepository subtaskRepository,
            ScrumTaskRepository taskRepository,
            UserRepository userRepository
    ) {
        this.subtaskRepository = subtaskRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ScrumSubtaskDto.Item> listSubtasks(Long taskId) {
        requireTask(taskId);
        return subtaskRepository.findByTaskIdOrderByIdAsc(taskId)
                .stream()
                .map(this::toItem)
                .toList();
    }

    @Transactional
    public ScrumSubtaskDto.Item createSubtask(Long taskId, ScrumSubtaskDto.CreateRequest request) {
        ScrumTask task = requireTask(taskId);

        if (request == null || request.title() == null || request.title().isBlank()) {
            throw new ScrumValidationException("Subtask title is required");
        }

        ScrumSubtask subtask = new ScrumSubtask();
        subtask.setTask(task);
        subtask.setTitle(request.title().trim());
        subtask.setCompleted(false);

        if (request.assigneeId() != null) {
            subtask.setAssignee(requireUser(request.assigneeId()));
        }

        return toItem(subtaskRepository.save(subtask));
    }

    @Transactional
    public ScrumSubtaskDto.Item updateSubtask(Long subtaskId, ScrumSubtaskDto.UpdateRequest request) {
        ScrumSubtask subtask = requireSubtask(subtaskId);

        if (request == null) {
            throw new ScrumValidationException("Update payload is required");
        }

        if (request.title() != null) {
            if (request.title().isBlank()) {
                throw new ScrumValidationException("Subtask title cannot be blank");
            }
            subtask.setTitle(request.title().trim());
        }

        if (request.completed() != null) {
            subtask.setCompleted(request.completed());
        }

        if (Boolean.TRUE.equals(request.unassign())) {
            subtask.setAssignee(null);
        } else if (request.assigneeId() != null) {
            subtask.setAssignee(requireUser(request.assigneeId()));
        }

        return toItem(subtaskRepository.save(subtask));
    }

    @Transactional
    public ScrumSubtaskDto.Item toggleSubtask(Long subtaskId) {
        ScrumSubtask subtask = requireSubtask(subtaskId);
        subtask.setCompleted(!subtask.isCompleted());
        return toItem(subtaskRepository.save(subtask));
    }

    @Transactional
    public ScrumSubtaskDto.Item deleteSubtask(Long subtaskId) {
        ScrumSubtask subtask = requireSubtask(subtaskId);
        ScrumSubtaskDto.Item item = toItem(subtask);
        subtaskRepository.delete(subtask);
        return item;
    }

    public ScrumSubtaskDto.Item toItem(ScrumSubtask subtask) {
        User assignee = subtask.getAssignee();
        return new ScrumSubtaskDto.Item(
                subtask.getId(),
                subtask.getTask().getId(),
                subtask.getTitle(),
                subtask.isCompleted(),
                assignee == null ? null : assignee.getId(),
                assignee == null ? null : assignee.getName(),
                ScrumTask.initialsOf(assignee == null ? null : assignee.getName())
        );
    }

    private ScrumTask requireTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ScrumNotFoundException("Task " + taskId + " not found"));
    }

    private ScrumSubtask requireSubtask(Long subtaskId) {
        return subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ScrumNotFoundException("Subtask " + subtaskId + " not found"));
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ScrumNotFoundException("User " + userId + " not found"));
    }
}
