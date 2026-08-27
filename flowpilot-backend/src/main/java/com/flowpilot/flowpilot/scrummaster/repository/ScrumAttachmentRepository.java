package com.flowpilot.flowpilot.scrummaster.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.flowpilot.flowpilot.scrummaster.model.ScrumAttachment;

@Repository
public interface ScrumAttachmentRepository
        extends JpaRepository<ScrumAttachment, Long> {

    /** Oldest first: the attachment list reads in the order files arrived. */
    List<ScrumAttachment> findByTaskIdOrderByUploadedAtAsc(Long taskId);

    long countByTaskId(Long taskId);
}
