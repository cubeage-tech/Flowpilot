package com.flowpilot.flowpilot.qa.repository;

import com.flowpilot.flowpilot.qa.model.QABugReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QABugReplyRepository extends JpaRepository<QABugReply, Long> {

    List<QABugReply> findByBugIdOrderByCreatedAtAsc(String bugId);

    List<QABugReply> findByQaBugReportIdOrderByCreatedAtAsc(Long qaBugReportId);
}
