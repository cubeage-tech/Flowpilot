package com.flowpilot.flowpilot.admin.service;

import com.flowpilot.flowpilot.admin.dto.AdminDepartmentDto;
import com.flowpilot.flowpilot.admin.model.AdminDepartment;
import com.flowpilot.flowpilot.admin.model.AdminDepartmentMember;
import com.flowpilot.flowpilot.admin.repository.AdminDepartmentsRepository;
import com.flowpilot.flowpilot.admin.repository.AdminDepartmentMemberRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminDepartmentsService implements CommandLineRunner {

    private final AdminDepartmentsRepository repository;
    private final AdminDepartmentMemberRepository memberRepository;

    public AdminDepartmentsService(
            AdminDepartmentsRepository repository,
            AdminDepartmentMemberRepository memberRepository) {

        this.repository = repository;
        this.memberRepository = memberRepository;
    }

    @Override
    public void run(String... args) {

        AdminDepartment engineering = addInitialDepartment(
                "Engineering",
                "Karan Mehta",
                18,
                40
        );

        AdminDepartment product = addInitialDepartment(
                "Product",
                "Arjun Shah",
                6,
                14
        );

        AdminDepartment qualityAssurance = addInitialDepartment(
                "Quality Assurance",
                "Sana Sheikh",
                7,
                16
        );

        AdminDepartment design = addInitialDepartment(
                "Design",
                "Divya Mehta",
                5,
                11
        );

        AdminDepartment operations = addInitialDepartment(
                "Operations",
                "Nisha Agarwal",
                8,
                20
        );

        AdminDepartment leadership = addInitialDepartment(
                "Leadership",
                "Rajeev Kumar",
                3,
                8
        );

        // Add initial members
        addInitialMembers(engineering);
        addInitialMembers(product);
        addInitialMembers(qualityAssurance);
        addInitialMembers(design);
        addInitialMembers(operations);
        addInitialMembers(leadership);
    }

    private AdminDepartment addInitialDepartment(
            String name,
            String head,
            int members,
            int progress) {

        AdminDepartment existingDepartment =
                repository.findAll()
                        .stream()
                        .filter(department ->
                                department.getName()
                                        .equalsIgnoreCase(name))
                        .findFirst()
                        .orElse(null);

        if (existingDepartment != null) {
            return existingDepartment;
        }

        AdminDepartment department = new AdminDepartment();

        department.setName(name);
        department.setHead(head);
        department.setMembers(members);
        department.setProgress(progress);

        return repository.save(department);
    }

    private void addInitialMembers(AdminDepartment department) {

        // Prevent duplicate members if backend restarts
        if (!memberRepository.findByDepartment(department).isEmpty()) {
            return;
        }

        switch (department.getName()) {

            case "Engineering":

                saveMember(
                        department,
                        "Karan Mehta",
                        "karan.mehta@ipmt.com",
                        "EMP001",
                        "Head of Engineering"
                );

                saveMember(
                        department,
                        "Rohit Varma",
                        "rohit.varma@ipmt.com",
                        "EMP002",
                        "Senior Developer"
                );

                saveMember(
                        department,
                        "Amit Sharma",
                        "amit.sharma@ipmt.com",
                        "EMP003",
                        "Software Developer"
                );

                break;

            case "Product":

                saveMember(
                        department,
                        "Arjun Shah",
                        "arjun.shah@ipmt.com",
                        "EMP004",
                        "Head of Product"
                );

                saveMember(
                        department,
                        "Priya Joshi",
                        "priya.joshi@ipmt.com",
                        "EMP005",
                        "Product Manager"
                );

                break;

            case "Quality Assurance":

                saveMember(
                        department,
                        "Sana Sheikh",
                        "sana.sheikh@ipmt.com",
                        "EMP006",
                        "QA Lead"
                );

                break;

            case "Design":

                saveMember(
                        department,
                        "Divya Mehta",
                        "divya.mehta@ipmt.com",
                        "EMP007",
                        "Design Lead"
                );

                break;

            case "Operations":

                saveMember(
                        department,
                        "Nisha Agarwal",
                        "nisha.agarwal@ipmt.com",
                        "EMP008",
                        "Operations Head"
                );

                break;

            case "Leadership":

                saveMember(
                        department,
                        "Rajeev Kumar",
                        "rajeev.kumar@ipmt.com",
                        "EMP009",
                        "Leadership"
                );

                break;

            default:
                break;
        }
    }

    private void saveMember(
            AdminDepartment department,
            String fullName,
            String email,
            String employeeId,
            String designation) {

        AdminDepartmentMember member =
                new AdminDepartmentMember();

        member.setDepartment(department);
        member.setFullName(fullName);
        member.setEmail(email);
        member.setEmployeeId(employeeId);
        member.setDesignation(designation);

        memberRepository.save(member);
    }

    public AdminDepartment addDepartment(
            AdminDepartmentDto dto) {

        if (repository.existsByNameIgnoreCase(dto.getName())) {

            throw new IllegalArgumentException(
                    "Department already exists"
            );
        }

        AdminDepartment department = new AdminDepartment();

        department.setName(dto.getName());
        department.setHead(dto.getHead());

        // We will eventually calculate this from members
        department.setMembers(dto.getMembers());

        department.setProgress(dto.getProgress());

        return repository.save(department);
    }

    public List<AdminDepartment> getAllDepartments() {

    List<AdminDepartment> departments =
            repository.findAll();

    for (AdminDepartment department : departments) {

        int memberCount =
                memberRepository
                        .findByDepartment(department)
                        .size();

        department.setMembers(memberCount);
    }

    return departments;
}
}