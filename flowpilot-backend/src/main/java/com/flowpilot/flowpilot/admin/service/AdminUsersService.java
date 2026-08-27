package com.flowpilot.flowpilot.admin.service;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.superadmin.dto.SuperAdminUserDto;
import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;
import com.flowpilot.flowpilot.superadmin.repository.SuperAdminUserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminUsersService {

    private final SuperAdminUserRepository userRepository;

    /*
     * Common users table used by the login system.
     */
    private final UserRepository commonUserRepository;


    // =========================================================
    // GET ALL USERS
    // =========================================================

    @Transactional(readOnly = true)
    public List<SuperAdminUserDto> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(this::convertToDto)
                .toList();
    }


    // =========================================================
    // GET USER BY EMPLOYEE ID
    // =========================================================

    @Transactional(readOnly = true)
    public SuperAdminUserDto getUserByEmployeeId(
            Long employeeId
    ) {

        if (employeeId == null) {

            throw new IllegalArgumentException(
                    "Employee ID is required."
            );
        }

        SuperAdminUser user =
                userRepository.findById(employeeId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found with employee ID: "
                                                + employeeId
                                )
                        );

        return convertToDto(user);
    }


    // =========================================================
    // SEARCH USERS
    // =========================================================

    @Transactional(readOnly = true)
    public List<SuperAdminUserDto> searchUsers(
            String keyword
    ) {

        if (keyword == null ||
                keyword.isBlank()) {

            return getAllUsers();
        }

        String searchTerm =
                keyword.trim().toLowerCase();

        return userRepository.findAll()
                .stream()
                .filter(user ->
                        matchesSearch(
                                user,
                                searchTerm
                        )
                )
                .map(this::convertToDto)
                .toList();
    }


    // =========================================================
    // SEARCH MATCHING
    // =========================================================

    private boolean matchesSearch(
            SuperAdminUser user,
            String searchTerm
    ) {

        String employeeId =
                user.getEmployeeId() != null
                        ? String.valueOf(
                                user.getEmployeeId()
                        )
                        : "";

        String name =
                user.getName() != null
                        ? user.getName()
                        : "";

        String email =
                user.getEmail() != null
                        ? user.getEmail()
                        : "";

        String role =
                user.getRole() != null
                        ? user.getRole()
                        : "";

        String department =
                user.getDepartment() != null
                        ? user.getDepartment()
                        : "";

        String designation =
                user.getDesignation() != null
                        ? user.getDesignation()
                        : "";

        return employeeId
                    .toLowerCase()
                    .contains(searchTerm)

                || ("EMP-" + employeeId)
                    .toLowerCase()
                    .contains(searchTerm)

                || name
                    .toLowerCase()
                    .contains(searchTerm)

                || email
                    .toLowerCase()
                    .contains(searchTerm)

                || role
                    .toLowerCase()
                    .contains(searchTerm)

                || department
                    .toLowerCase()
                    .contains(searchTerm)

                || designation
                    .toLowerCase()
                    .contains(searchTerm);
    }


    // =========================================================
    // UPDATE USER
    // =========================================================

    public SuperAdminUserDto updateUser(
            Long employeeId,
            SuperAdminUserDto dto
    ) {

        if (employeeId == null) {

            throw new IllegalArgumentException(
                    "Employee ID is required."
            );
        }

        if (dto == null) {

            throw new IllegalArgumentException(
                    "User data cannot be null."
            );
        }


        SuperAdminUser user =
                userRepository.findById(employeeId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found with employee ID: "
                                                + employeeId
                                )
                        );


        // =====================================================
        // STORE OLD EMAIL
        // =====================================================

        String oldEmail =
                user.getEmail();


        // =====================================================
        // NAME
        // =====================================================

        if (dto.getName() != null &&
                !dto.getName().isBlank()) {

            user.setName(
                    dto.getName().trim()
            );
        }


        // =====================================================
        // EMAIL
        // =====================================================

        if (dto.getEmail() != null &&
                !dto.getEmail().isBlank()) {

            String newEmail =
                    dto.getEmail().trim();


            if (!newEmail.equalsIgnoreCase(
                    oldEmail
            )) {

                /*
                 * Check whether another SuperAdminUser
                 * already has this email.
                 */
                userRepository
                        .findByEmail(newEmail)
                        .ifPresent(existing -> {

                            if (!existing
                                    .getEmployeeId()
                                    .equals(employeeId)) {

                                throw new IllegalArgumentException(
                                        "A user with this email already exists."
                                );
                            }
                        });


                /*
                 * Check whether another login account
                 * already uses this email.
                 */
                commonUserRepository
                        .findByEmail(newEmail)
                        .ifPresent(existing -> {

                            throw new IllegalArgumentException(
                                    "A login account with this email already exists."
                            );
                        });


                user.setEmail(newEmail);
            }
        }


        // =====================================================
        // ROLE
        // =====================================================

        if (dto.getRole() != null &&
                !dto.getRole().isBlank()) {

            user.setRole(
                    dto.getRole().trim()
            );
        }


        // =====================================================
        // DEPARTMENT
        // =====================================================

        if (dto.getDepartment() != null &&
                !dto.getDepartment().isBlank()) {

            user.setDepartment(
                    dto.getDepartment().trim()
            );
        }


        /*
         * IMPORTANT:
         *
         * Status is NOT changed here.
         *
         * Admin's edit form does not contain a status field.
         *
         * Status is changed only through:
         *
         * PATCH /api/admin/users/{employeeId}/status
         */


        // =====================================================
        // SAVE SUPERADMIN USER
        // =====================================================

        SuperAdminUser updated =
                userRepository.save(user);


        // =====================================================
        // UPDATE LOGIN USER
        // =====================================================

        /*
         * If the email changed, find the login account
         * using the OLD email.
         *
         * This is important because the common users table
         * still contains the old email at this point.
         */
        commonUserRepository
                .findByEmail(oldEmail)
                .ifPresent(loginUser -> {

                    loginUser.setName(
                            user.getName()
                    );

                    loginUser.setEmail(
                            user.getEmail()
                    );

                    loginUser.setRole(
                            user.getRole()
                    );

                    commonUserRepository.save(
                            loginUser
                    );
                });


        return convertToDto(updated);
    }


    // =========================================================
    // ENABLE / DISABLE
    // =========================================================

    public SuperAdminUserDto toggleStatus(
            Long employeeId
    ) {

        if (employeeId == null) {

            throw new IllegalArgumentException(
                    "Employee ID is required."
            );
        }


        SuperAdminUser user =
                userRepository.findById(employeeId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found with employee ID: "
                                                + employeeId
                                )
                        );


        boolean active =
                Boolean.TRUE.equals(
                        user.getActive()
                );


        if (active) {

            user.setActive(false);

            user.setStatus("INACTIVE");

        } else {

            user.setActive(true);

            user.setStatus("ACTIVE");
        }


        SuperAdminUser updated =
                userRepository.save(user);


        return convertToDto(updated);
    }


    // =========================================================
    // ENTITY → DTO
    // =========================================================

    private SuperAdminUserDto convertToDto(
            SuperAdminUser user
    ) {

        return SuperAdminUserDto.builder()

                .employeeId(
                        user.getEmployeeId()
                )

                .name(
                        user.getName()
                )

                .email(
                        user.getEmail()
                )

                .role(
                        user.getRole()
                )

                .department(
                        user.getDepartment()
                )

                .designation(
                        user.getDesignation()
                )

                /*
                 * Never send password to frontend.
                 */
                .password(null)

                .status(
                        user.getStatus()
                )

                .lastLogin(
                        user.getLastLogin() != null
                                ? user.getLastLogin().toString()
                                : "Never"
                )

                .initials(
                        generateInitials(
                                user.getName()
                        )
                )

                .build();
    }


    // =========================================================
    // INITIALS
    // =========================================================

    private String generateInitials(
            String name
    ) {

        if (name == null ||
                name.isBlank()) {

            return "";
        }


        String[] parts =
                name.trim()
                        .split("\\s+");


        if (parts.length == 1) {

            return parts[0]
                    .substring(
                            0,
                            Math.min(
                                    2,
                                    parts[0].length()
                            )
                    )
                    .toUpperCase();
        }


        return (
                parts[0]
                        .substring(0, 1)
                        +
                parts[parts.length - 1]
                        .substring(0, 1)
        ).toUpperCase();
    }
}