package com.flowpilot.flowpilot.superadmin.service;

import com.flowpilot.flowpilot.superadmin.dto.SuperAdminRoleDto;
import com.flowpilot.flowpilot.superadmin.model.SuperAdminRole;
import com.flowpilot.flowpilot.superadmin.repository.SuperAdminRoleRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SuperAdminRolesService {

    private final SuperAdminRoleRepository roleRepository;

    /*
     * =========================================================
     * GET ALL ROLES
     * =========================================================
     *
     * IMPORTANT:
     *
     * We NEVER overwrite permissions here.
     *
     * Whatever is stored in the database is returned.
     *
     * This is important because SUPER ADMIN can manage
     * its own permissions.
     */
    @Transactional
    public List<SuperAdminRoleDto> getAllRoles() {

        /*
         * Create only roles which do not already exist.
         *
         * This prevents duplicate SUPER ADMIN records.
         */
        createMissingDefaultRoles();

        return roleRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    /*
     * =========================================================
     * GET ROLE BY ID
     * =========================================================
     *
     * No permission is automatically changed here.
     */
    @Transactional(readOnly = true)
    public SuperAdminRoleDto getRoleById(Long id) {

        SuperAdminRole role =
                roleRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Role not found with id: " + id
                                )
                        );

        return toDto(role);
    }

    /*
     * =========================================================
     * UPDATE ROLE
     * =========================================================
     *
     * SUPER ADMIN CAN MODIFY ITS OWN PERMISSIONS.
     *
     * We do NOT force SUPER ADMIN permissions to TRUE.
     */
    @Transactional
    public SuperAdminRoleDto updateRole(
            Long id,
            SuperAdminRoleDto dto
    ) {

        if (dto == null) {
            throw new RuntimeException(
                    "Role data cannot be null"
            );
        }

        SuperAdminRole role =
                roleRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Role not found with id: " + id
                                )
                        );

        /*
         * =====================================================
         * UPDATE NAME
         * =====================================================
         */

        if (dto.getName() != null &&
                !dto.getName().trim().isEmpty()) {

            String newName =
                    dto.getName().trim();

            String oldName =
                    role.getName() != null
                            ? role.getName().trim()
                            : "";

            /*
             * Prevent duplicate role names.
             */
            if (!newName.equalsIgnoreCase(oldName) &&
                    roleRepository.existsByNameIgnoreCase(newName)) {

                throw new RuntimeException(
                        "Role already exists: " + newName
                );
            }

            role.setName(newName);
        }

        /*
         * =====================================================
         * UPDATE DESCRIPTION
         * =====================================================
         */

        if (dto.getDescription() != null) {

            role.setDescription(
                    dto.getDescription()
            );
        }

        /*
         * =====================================================
         * UPDATE ACTIVE STATUS
         * =====================================================
         *
         * SUPER ADMIN cannot be disabled.
         *
         * This prevents the administrator from accidentally
         * locking itself out of the system.
         */

        boolean isSuperAdmin =
                role.getName() != null &&
                role.getName()
                        .trim()
                        .equalsIgnoreCase("SUPER ADMIN");

        if (isSuperAdmin) {

            role.setActive(true);

        } else if (dto.getActive() != null) {

            role.setActive(
                    dto.getActive()
            );
        }

        /*
         * =====================================================
         * UPDATE PERMISSIONS
         * =====================================================
         *
         * THIS IS THE MOST IMPORTANT PART.
         *
         * We accept the permission matrix from the frontend
         * and store it exactly as provided.
         *
         * Therefore:
         *
         * SUPER ADMIN
         * delete-users.delete = false
         *
         * remains FALSE in the database.
         *
         * We DO NOT automatically change it back to TRUE.
         */

        if (dto.getPermissions() != null) {

            Map<String, Boolean> updatedPermissions =
                    new HashMap<>();

            for (
                    Map.Entry<String, Boolean> entry
                    : dto.getPermissions().entrySet()
            ) {

                String key =
                        entry.getKey();

                Boolean value =
                        entry.getValue();

                if (
                        key != null &&
                        !key.trim().isEmpty() &&
                        value != null
                ) {

                    updatedPermissions.put(
                            key,
                            value
                    );
                }
            }

            role.setPermissions(
                    updatedPermissions
            );
        }

        /*
         * If the database somehow contains NULL permissions,
         * initialize an empty map.
         *
         * IMPORTANT:
         * We do NOT give full permissions here.
         */
        if (role.getPermissions() == null) {

            role.setPermissions(
                    new HashMap<>()
            );
        }

        /*
         * SUPER ADMIN must remain active.
         *
         * This does NOT give SUPER ADMIN full permissions.
         */
        if (
                role.getName() != null &&
                role.getName()
                        .trim()
                        .equalsIgnoreCase("SUPER ADMIN")
        ) {

            role.setActive(true);
        }

        /*
         * Save the exact permission configuration.
         */
        SuperAdminRole savedRole =
                roleRepository.save(role);

        return toDto(savedRole);
    }

    /*
     * =========================================================
     * CREATE MISSING DEFAULT ROLES
     * =========================================================
     *
     * IMPORTANT:
     *
     * We do NOT use:
     *
     *     roleRepository.count() == 0
     *
     * because your database may already contain some roles.
     *
     * Every role is checked individually.
     *
     * This prevents:
     *
     * duplicate key violates unique constraint
     *
     * for SUPER ADMIN.
     */
    @Transactional
    protected void createMissingDefaultRoles() {

        List<SuperAdminRole> rolesToCreate =
                new ArrayList<>();

        /*
         * =====================================================
         * SUPER ADMIN
         * =====================================================
         *
         * Full permissions are assigned ONLY if this role
         * does not exist at all.
         *
         * Existing SUPER ADMIN permissions are NEVER changed.
         */

        if (
                !roleRepository.existsByNameIgnoreCase(
                        "SUPER ADMIN"
                )
        ) {

            rolesToCreate.add(
                    createRole(
                            "SUPER ADMIN",
                            "Full system access",
                            superAdminPermissions()
                    )
            );
        }

        /*
         * =====================================================
         * ADMIN
         * =====================================================
         */

        if (
                !roleRepository.existsByNameIgnoreCase(
                        "ADMIN"
                )
        ) {

            rolesToCreate.add(
                    createRole(
                            "ADMIN",
                            "Organization management",
                            adminPermissions()
                    )
            );
        }

        /*
         * =====================================================
         * PROJECT MANAGER
         * =====================================================
         */

        if (
                !roleRepository.existsByNameIgnoreCase(
                        "PM"
                )
        ) {

            rolesToCreate.add(
                    createRole(
                            "PM",
                            "Project management",
                            pmPermissions()
                    )
            );
        }

        /*
         * =====================================================
         * SCRUM MASTER
         * =====================================================
         */

        if (
                !roleRepository.existsByNameIgnoreCase(
                        "SCRUM"
                )
        ) {

            rolesToCreate.add(
                    createRole(
                            "SCRUM",
                            "Sprint management",
                            scrumPermissions()
                    )
            );
        }

        /*
         * =====================================================
         * DEVELOPER
         * =====================================================
         */

        if (
                !roleRepository.existsByNameIgnoreCase(
                        "DEVELOPER"
                )
        ) {

            rolesToCreate.add(
                    createRole(
                            "DEVELOPER",
                            "Development access",
                            developerPermissions()
                    )
            );
        }

        /*
         * =====================================================
         * QA
         * =====================================================
         */

        if (
                !roleRepository.existsByNameIgnoreCase(
                        "QA"
                )
        ) {

            rolesToCreate.add(
                    createRole(
                            "QA",
                            "Testing and quality",
                            qaPermissions()
                    )
            );
        }

        /*
         * =====================================================
         * VIEWER
         * =====================================================
         */

        if (
                !roleRepository.existsByNameIgnoreCase(
                        "VIEWER"
                )
        ) {

            rolesToCreate.add(
                    createRole(
                            "VIEWER",
                            "Read-only access",
                            viewerPermissions()
                    )
            );
        }

        /*
         * Save only missing roles.
         */
        if (!rolesToCreate.isEmpty()) {

            roleRepository.saveAll(
                    rolesToCreate
            );
        }
    }

    /*
     * =========================================================
     * CREATE ROLE
     * =========================================================
     *
     * Uses setters instead of builder().
     *
     * This fixes:
     *
     * "The method builder() is undefined for the type
     *  SuperAdminRole"
     */
    private SuperAdminRole createRole(
            String name,
            String description,
            Map<String, Boolean> permissions
    ) {

        SuperAdminRole role =
                new SuperAdminRole();

        role.setName(name);

        role.setDescription(
                description
        );

        role.setActive(true);

        role.setPermissions(
                new HashMap<>(
                        permissions
                )
        );

        return role;
    }

    /*
     * =========================================================
     * SUPER ADMIN DEFAULT PERMISSIONS
     * =========================================================
     *
     * Used ONLY when SUPER ADMIN does not exist.
     *
     * Once created, these permissions can be changed from
     * the frontend.
     */
    private Map<String, Boolean> superAdminPermissions() {

        Map<String, Boolean> p =
                new HashMap<>();

        add(
                p,
                "create-users",
                true,
                true,
                true,
                true
        );

        add(
                p,
                "delete-users",
                true,
                true,
                true,
                true
        );

        add(
                p,
                "manage-departments",
                true,
                true,
                true,
                true
        );

        add(
                p,
                "manage-settings",
                true,
                true,
                true,
                true
        );

        add(
                p,
                "create-projects",
                true,
                true,
                true,
                true
        );

        add(
                p,
                "manage-sprints",
                true,
                true,
                true,
                true
        );

        add(
                p,
                "assign-tasks",
                true,
                true,
                true,
                true
        );

        add(
                p,
                "update-status",
                true,
                true,
                true,
                true
        );

        add(
                p,
                "log-time",
                true,
                true,
                true,
                true
        );

        add(
                p,
                "bug-reports",
                true,
                true,
                true,
                true
        );

        add(
                p,
                "view-reports",
                true,
                true,
                true,
                true
        );

        add(
                p,
                "export-reports",
                true,
                true,
                true,
                true
        );

        return p;
    }

    /*
     * =========================================================
     * ADMIN PERMISSIONS
     * =========================================================
     */

    private Map<String, Boolean> adminPermissions() {

        Map<String, Boolean> p =
                new HashMap<>();

        add(
                p,
                "create-users",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "delete-users",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "manage-departments",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "manage-settings",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "create-projects",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "manage-sprints",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "assign-tasks",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "update-status",
                true,
                false,
                true,
                false
        );

        add(
                p,
                "log-time",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "bug-reports",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "view-reports",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "export-reports",
                true,
                true,
                false,
                false
        );

        return p;
    }

    /*
     * =========================================================
     * PROJECT MANAGER PERMISSIONS
     * =========================================================
     */

    private Map<String, Boolean> pmPermissions() {

        Map<String, Boolean> p =
                new HashMap<>();

        add(
                p,
                "create-users",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "delete-users",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "manage-departments",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "manage-settings",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "create-projects",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "manage-sprints",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "assign-tasks",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "update-status",
                true,
                false,
                true,
                false
        );

        add(
                p,
                "log-time",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "bug-reports",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "view-reports",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "export-reports",
                true,
                true,
                false,
                false
        );

        return p;
    }

    /*
     * =========================================================
     * SCRUM MASTER PERMISSIONS
     * =========================================================
     */

    private Map<String, Boolean> scrumPermissions() {

        Map<String, Boolean> p =
                new HashMap<>();

        add(
                p,
                "create-users",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "delete-users",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "manage-departments",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "manage-settings",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "create-projects",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "manage-sprints",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "assign-tasks",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "update-status",
                true,
                false,
                true,
                false
        );

        add(
                p,
                "log-time",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "bug-reports",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "view-reports",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "export-reports",
                true,
                false,
                false,
                false
        );

        return p;
    }

    /*
     * =========================================================
     * DEVELOPER PERMISSIONS
     * =========================================================
     */

    private Map<String, Boolean> developerPermissions() {

        Map<String, Boolean> p =
                new HashMap<>();

        add(
                p,
                "create-users",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "delete-users",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "manage-departments",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "manage-settings",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "create-projects",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "manage-sprints",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "assign-tasks",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "update-status",
                true,
                false,
                true,
                false
        );

        add(
                p,
                "log-time",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "bug-reports",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "view-reports",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "export-reports",
                false,
                false,
                false,
                false
        );

        return p;
    }

    /*
     * =========================================================
     * QA PERMISSIONS
     * =========================================================
     */

    private Map<String, Boolean> qaPermissions() {

        Map<String, Boolean> p =
                new HashMap<>();

        add(
                p,
                "create-users",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "delete-users",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "manage-departments",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "manage-settings",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "create-projects",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "manage-sprints",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "assign-tasks",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "update-status",
                true,
                false,
                true,
                false
        );

        add(
                p,
                "log-time",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "bug-reports",
                true,
                true,
                true,
                false
        );

        add(
                p,
                "view-reports",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "export-reports",
                true,
                false,
                false,
                false
        );

        return p;
    }

    /*
     * =========================================================
     * VIEWER PERMISSIONS
     * =========================================================
     */

    private Map<String, Boolean> viewerPermissions() {

        Map<String, Boolean> p =
                new HashMap<>();

        add(
                p,
                "create-users",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "delete-users",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "manage-departments",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "manage-settings",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "create-projects",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "manage-sprints",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "assign-tasks",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "update-status",
                false,
                false,
                false,
                false
        );

        add(
                p,
                "log-time",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "bug-reports",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "view-reports",
                true,
                false,
                false,
                false
        );

        add(
                p,
                "export-reports",
                false,
                false,
                false,
                false
        );

        return p;
    }

    /*
     * =========================================================
     * ADD PERMISSION
     * =========================================================
     */

    private void add(
            Map<String, Boolean> map,
            String permission,
            boolean read,
            boolean create,
            boolean edit,
            boolean delete
    ) {

        map.put(
                permission + ".read",
                read
        );

        map.put(
                permission + ".create",
                create
        );

        map.put(
                permission + ".edit",
                edit
        );

        map.put(
                permission + ".delete",
                delete
        );
    }

    /*
     * =========================================================
     * ENTITY -> DTO
     * =========================================================
     */

    private SuperAdminRoleDto toDto(
            SuperAdminRole role
    ) {

        Map<String, Boolean> permissions =
                role.getPermissions() != null
                        ? new HashMap<>(
                                role.getPermissions()
                        )
                        : new HashMap<>();

        return SuperAdminRoleDto.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .active(role.getActive())
                .createdAt(role.getCreatedAt())
                .permissions(permissions)
                .build();
    }
}