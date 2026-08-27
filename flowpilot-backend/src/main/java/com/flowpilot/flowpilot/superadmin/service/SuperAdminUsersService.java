package com.flowpilot.flowpilot.superadmin.service;

import com.flowpilot.flowpilot.common.model.User;
import com.flowpilot.flowpilot.common.repository.UserRepository;
import com.flowpilot.flowpilot.superadmin.dto.SuperAdminUserDto;
import com.flowpilot.flowpilot.superadmin.model.SuperAdminUser;
import com.flowpilot.flowpilot.superadmin.repository.SuperAdminUserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional
public class SuperAdminUsersService {

    private final SuperAdminUserRepository userRepository;

    /*
     * Repository for the common "users" table.
     * This table is used by the normal login system.
     */
    private final UserRepository commonUserRepository;

    /*
     * Used to encode passwords before storing them.
     */
    private final PasswordEncoder passwordEncoder;

    /*
     * Used to send the newly created user's credentials
     * to the email entered in the Add User form.
     */
    private final EmailService emailService;


    // =========================================================
    // VALIDATION PATTERNS
    // =========================================================

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile(
                    "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
            );

    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile(
                    "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$"
            );


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
    // SEARCH MATCHING LOGIC
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
    // CREATE USER
    // =========================================================

    public SuperAdminUserDto createUser(
            SuperAdminUserDto dto
    ) {

        if (dto == null) {

            throw new IllegalArgumentException(
                    "User data cannot be null."
            );
        }


        // -----------------------------------------------------
        // NAME
        // -----------------------------------------------------

        if (dto.getName() == null ||
                dto.getName().isBlank()) {

            throw new IllegalArgumentException(
                    "Name is required."
            );
        }

        String name =
                dto.getName().trim();


        // -----------------------------------------------------
        // EMAIL
        // -----------------------------------------------------

        if (dto.getEmail() == null ||
                dto.getEmail().isBlank()) {

            throw new IllegalArgumentException(
                    "Email address is required."
            );
        }

        String email =
                dto.getEmail().trim();


        if (!isValidEmail(email)) {

            throw new IllegalArgumentException(
                    "Please enter a valid email address."
            );
        }


        // -----------------------------------------------------
        // CHECK EMAIL IN SUPERADMIN USERS
        // -----------------------------------------------------

        if (userRepository.existsByEmail(email)) {

            throw new IllegalArgumentException(
                    "A user with this email already exists."
            );
        }


        // -----------------------------------------------------
        // CHECK EMAIL IN COMMON USERS
        // -----------------------------------------------------

        if (commonUserRepository.existsByEmail(email)) {

            throw new IllegalArgumentException(
                    "A login account with this email already exists."
            );
        }


        // -----------------------------------------------------
        // PASSWORD
        // -----------------------------------------------------

        if (dto.getPassword() == null ||
                dto.getPassword().isBlank()) {

            throw new IllegalArgumentException(
                    "Password is required."
            );
        }

        /*
         * Keep the original password only in memory.
         *
         * It will NOT be stored in either database table.
         * It is required only for sending the welcome email.
         */
        String rawPassword =
                dto.getPassword();

        validatePassword(
                rawPassword
        );


        // -----------------------------------------------------
        // ENCODE PASSWORD
        // -----------------------------------------------------

        String encodedPassword =
                passwordEncoder.encode(
                        rawPassword
                );


        // -----------------------------------------------------
        // OPTIONAL VALUES
        // -----------------------------------------------------

        String role =
                cleanValue(
                        dto.getRole()
                );

        String department =
                cleanValue(
                        dto.getDepartment()
                );

        String designation =
                cleanValue(
                        dto.getDesignation()
                );


        // -----------------------------------------------------
        // STATUS
        // -----------------------------------------------------

        String status =
                getInitialStatus(
                        dto.getStatus()
                );


        // =====================================================
        // 1. SAVE SUPERADMIN USER
        // =====================================================

        SuperAdminUser superAdminUser =
                SuperAdminUser.builder()

                        .name(name)

                        .email(email)

                        /*
                         * Only encoded password is stored.
                         */
                        .password(
                                encodedPassword
                        )

                        .role(role)

                        .department(department)

                        .designation(designation)

                        .status(status)

                        .active(
                                status.equals("ACTIVE")
                        )

                        .createdAt(
                                LocalDateTime.now()
                        )

                        .lastLogin(null)

                        .build();


        SuperAdminUser savedSuperAdminUser =
                userRepository.save(
                        superAdminUser
                );


        // =====================================================
        // 2. SAVE LOGIN USER
        // =====================================================

        User loginUser =
                new User();


        loginUser.setName(name);

        loginUser.setEmail(email);

        /*
         * IMPORTANT:
         *
         * Use the same encoded password.
         * Do NOT encode encodedPassword again.
         */
        loginUser.setPassword(
                encodedPassword
        );

        loginUser.setRole(role);


        /*
         * This creates the record in the "users" table.
         */
        commonUserRepository.save(
                loginUser
        );


        // =====================================================
        // 3. SEND WELCOME EMAIL
        // =====================================================

        /*
         * Send the original password to the email address
         * entered in the Add User form.
         *
         * rawPassword is never stored in the database.
         */
        emailService.sendWelcomeEmail(

                email,

                name,

                rawPassword,

                role,

                department,

                designation
        );


        // =====================================================
        // RETURN CREATED USER
        // =====================================================

        return convertToDto(
                savedSuperAdminUser
        );
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


        // -----------------------------------------------------
        // NAME
        // -----------------------------------------------------

        if (dto.getName() != null &&
                !dto.getName().isBlank()) {

            user.setName(
                    dto.getName().trim()
            );
        }


        // -----------------------------------------------------
        // EMAIL
        // -----------------------------------------------------

        if (dto.getEmail() != null &&
                !dto.getEmail().isBlank()) {

            String newEmail =
                    dto.getEmail().trim();


            if (!isValidEmail(newEmail)) {

                throw new IllegalArgumentException(
                        "Please enter a valid email address."
                );
            }


            if (!newEmail.equalsIgnoreCase(
                    user.getEmail()
            )) {

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


        // -----------------------------------------------------
        // ROLE
        // -----------------------------------------------------

        if (dto.getRole() != null &&
                !dto.getRole().isBlank()) {

            user.setRole(
                    dto.getRole().trim()
            );
        }


        // -----------------------------------------------------
        // DEPARTMENT
        // -----------------------------------------------------

        if (dto.getDepartment() != null &&
                !dto.getDepartment().isBlank()) {

            user.setDepartment(
                    dto.getDepartment().trim()
            );
        }


        // -----------------------------------------------------
        // DESIGNATION
        // -----------------------------------------------------

        if (dto.getDesignation() != null &&
                !dto.getDesignation().isBlank()) {

            user.setDesignation(
                    dto.getDesignation().trim()
            );
        }


        // -----------------------------------------------------
        // PASSWORD
        // -----------------------------------------------------

        if (dto.getPassword() != null &&
                !dto.getPassword().isBlank()) {

            validatePassword(
                    dto.getPassword()
            );


            String encodedPassword =
                    passwordEncoder.encode(
                            dto.getPassword()
                    );


            user.setPassword(
                    encodedPassword
            );


            /*
             * Keep login password synchronized.
             */
            commonUserRepository
                    .findByEmail(
                            user.getEmail()
                    )
                    .ifPresent(loginUser -> {

                        loginUser.setPassword(
                                encodedPassword
                        );

                        commonUserRepository.save(
                                loginUser
                        );
                    });
        }


        // -----------------------------------------------------
        // STATUS
        // -----------------------------------------------------

        if (dto.getStatus() != null &&
                !dto.getStatus().isBlank()) {

            String status =
                    dto.getStatus()
                            .trim()
                            .toUpperCase();


            if (!status.equals("ACTIVE") &&
                    !status.equals("INACTIVE")) {

                throw new IllegalArgumentException(
                        "Status must be ACTIVE or INACTIVE."
                );
            }


            user.setStatus(status);

            user.setActive(
                    status.equals("ACTIVE")
            );
        }


        // -----------------------------------------------------
        // SAVE SUPERADMIN USER
        // -----------------------------------------------------

        SuperAdminUser updated =
                userRepository.save(user);


        // -----------------------------------------------------
        // UPDATE LOGIN USER
        // -----------------------------------------------------

        commonUserRepository
                .findByEmail(
                        user.getEmail()
                )
                .ifPresent(loginUser -> {

                    loginUser.setName(
                            user.getName()
                    );

                    loginUser.setRole(
                            user.getRole()
                    );

                    commonUserRepository.save(
                            loginUser
                    );
                });


        return convertToDto(
                updated
        );
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


        boolean isActive =
                Boolean.TRUE.equals(
                        user.getActive()
                );


        if (isActive) {

            user.setActive(false);

            user.setStatus("INACTIVE");

        } else {

            user.setActive(true);

            user.setStatus("ACTIVE");
        }


        SuperAdminUser updated =
                userRepository.save(user);


        return convertToDto(
                updated
        );
    }


    // =========================================================
    // DELETE USER
    // =========================================================

    public void deleteUser(
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


        if (Boolean.TRUE.equals(
                user.getActive()
        )) {

            throw new IllegalStateException(
                    "Active users cannot be deleted. Disable the user first."
            );
        }


        /*
         * Delete corresponding login account.
         */
        commonUserRepository
                .findByEmail(
                        user.getEmail()
                )
                .ifPresent(
                        commonUserRepository::delete
                );


        userRepository.delete(user);
    }


    // =========================================================
    // EMAIL VALIDATION
    // =========================================================

    private boolean isValidEmail(
            String email
    ) {

        return email != null &&
                EMAIL_PATTERN.matcher(
                        email
                ).matches();
    }


    // =========================================================
    // PASSWORD VALIDATION
    // =========================================================

    private void validatePassword(
            String password
    ) {

        if (password == null ||
                password.isBlank()) {

            throw new IllegalArgumentException(
                    "Password is required."
            );
        }


        if (!PASSWORD_PATTERN.matcher(
                password
        ).matches()) {

            throw new IllegalArgumentException(
                    "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number and one special character."
            );
        }
    }


    // =========================================================
    // INITIAL STATUS
    // =========================================================

    private String getInitialStatus(
            String status
    ) {

        if (status == null ||
                status.isBlank()) {

            return "ACTIVE";
        }


        String normalized =
                status.trim()
                        .toUpperCase();


        if (!normalized.equals("ACTIVE") &&
                !normalized.equals("INACTIVE")) {

            throw new IllegalArgumentException(
                    "Status must be ACTIVE or INACTIVE."
            );
        }


        return normalized;
    }


    // =========================================================
    // CLEAN OPTIONAL VALUE
    // =========================================================

    private String cleanValue(
            String value
    ) {

        if (value == null ||
                value.isBlank()) {

            return null;
        }


        return value.trim();
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
                 * NEVER send password to frontend.
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