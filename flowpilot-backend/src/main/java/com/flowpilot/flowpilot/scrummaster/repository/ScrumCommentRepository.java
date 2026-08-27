package com.flowpilot.flowpilot.scrummaster.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumComment;

@Repository
public interface ScrumCommentRepository
        extends JpaRepository<ScrumComment, Long> {

    /** Oldest first: a comment thread reads as a conversation. */
    List<ScrumComment> findByTaskIdOrderByCreatedAtAsc(Long taskId);

    long countByTaskId(Long taskId);

    void deleteByTaskId(Long taskId);
}
