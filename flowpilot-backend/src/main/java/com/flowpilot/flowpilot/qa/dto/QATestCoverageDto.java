package com.flowpilot.flowpilot.qa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QATestCoverageDto {

    private int totalTestCases;
    private int executed;
    private int passed;
    private int failedBlocked;
    private List<ModuleCoverageDto> modules;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModuleCoverageDto {

        private String name;
        private int cases;
        private int executed;
        private int percentage;
    }
}