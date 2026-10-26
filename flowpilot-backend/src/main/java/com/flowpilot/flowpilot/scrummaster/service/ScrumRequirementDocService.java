package com.flowpilot.flowpilot.scrummaster.service;

import com.flowpilot.flowpilot.scrummaster.dto.ScrumProjectDto;
import com.flowpilot.flowpilot.scrummaster.dto.ScrumRequirementDocDto;
import com.flowpilot.flowpilot.scrummaster.model.ScrumRequirementDoc;
import com.flowpilot.flowpilot.scrummaster.repository.ScrumRequirementDocRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ScrumRequirementDocService {

    private final ScrumRequirementDocRepository docRepository;
    private final ScrumProjectService projectService;

    @Transactional(readOnly = true)
    public List<ScrumRequirementDocDto> getDocuments(Long projectId) {
        List<ScrumRequirementDoc> docs = (projectId != null)
                ? docRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                : docRepository.findAllByOrderByCreatedAtDesc();

        return docs.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ScrumRequirementDocDto getDocumentById(Long id) {
        ScrumRequirementDoc doc = docRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + id));
        return toDto(doc);
    }

    public ScrumRequirementDocDto createDocument(ScrumRequirementDocDto dto) {
        ScrumRequirementDoc doc = ScrumRequirementDoc.builder()
                .projectId(dto.getProjectId())
                .title(dto.getTitle() != null ? dto.getTitle().trim() : "Untitled Requirement")
                .docType(dto.getDocType() != null ? dto.getDocType() : "PRD")
                .content(dto.getContent())
                .fileUrl(dto.getFileUrl())
                .version(dto.getVersion() != null && !dto.getVersion().isBlank() ? dto.getVersion() : "v1.0")
                .status(dto.getStatus() != null && !dto.getStatus().isBlank() ? dto.getStatus() : "Draft")
                .createdBy(dto.getCreatedBy() != null ? dto.getCreatedBy() : "Scrum Master")
                .build();

        ScrumRequirementDoc saved = docRepository.save(doc);
        return toDto(saved);
    }

    public ScrumRequirementDocDto updateDocument(Long id, ScrumRequirementDocDto dto) {
        ScrumRequirementDoc doc = docRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + id));

        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            doc.setTitle(dto.getTitle().trim());
        }
        if (dto.getDocType() != null && !dto.getDocType().isBlank()) {
            doc.setDocType(dto.getDocType());
        }
        if (dto.getContent() != null) {
            doc.setContent(dto.getContent());
        }
        if (dto.getFileUrl() != null) {
            doc.setFileUrl(dto.getFileUrl());
        }
        if (dto.getVersion() != null && !dto.getVersion().isBlank()) {
            doc.setVersion(dto.getVersion());
        }
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            doc.setStatus(dto.getStatus());
        }
        if (dto.getProjectId() != null) {
            doc.setProjectId(dto.getProjectId());
        }

        ScrumRequirementDoc saved = docRepository.save(doc);
        return toDto(saved);
    }

    public void deleteDocument(Long id) {
        docRepository.deleteById(id);
    }

    private ScrumRequirementDocDto toDto(ScrumRequirementDoc doc) {
        String projectName = "General / Unassigned";
        if (doc.getProjectId() != null) {
            Optional<ScrumProjectDto.Project> pOpt = projectService.findProject(doc.getProjectId());
            if (pOpt.isPresent()) {
                projectName = pOpt.get().name();
            }
        }

        return ScrumRequirementDocDto.builder()
                .id(doc.getId())
                .projectId(doc.getProjectId())
                .projectName(projectName)
                .title(doc.getTitle())
                .docType(doc.getDocType())
                .content(doc.getContent())
                .fileUrl(doc.getFileUrl())
                .version(doc.getVersion())
                .status(doc.getStatus())
                .createdBy(doc.getCreatedBy())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }
}
