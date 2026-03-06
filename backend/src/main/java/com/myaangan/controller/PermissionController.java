package com.myaangan.controller;

import com.myaangan.dto.UserDto;
import com.myaangan.entity.RolePermission;
import com.myaangan.enums.Permission;
import com.myaangan.enums.Role;
import com.myaangan.repository.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/permissions")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class PermissionController {

    private final RolePermissionRepository repo;

    /**
     * GET /api/admin/permissions
     * Returns the full matrix: { ROLE_NAME: { PERMISSION_NAME: true/false, … }, … }
     * All non-ADMIN roles × all Permission enum values are included (missing DB rows → false).
     */
    @GetMapping
    public ResponseEntity<UserDto.ApiResponse<Map<String, Map<String, Boolean>>>> getMatrix() {
        // Fetch all rows once
        List<RolePermission> rows = repo.findAllOrdered();
        Map<String, Map<String, Boolean>> index = new LinkedHashMap<>();
        for (RolePermission rp : rows) {
            index
                .computeIfAbsent(rp.getRole().name(), k -> new LinkedHashMap<>())
                .put(rp.getPermission().name(), rp.isGranted());
        }

        // Build the full matrix, defaulting missing entries to false
        // ADMIN is excluded — it always has every permission.
        Map<String, Map<String, Boolean>> matrix = new LinkedHashMap<>();
        for (Role role : Role.values()) {
            if (role == Role.ADMIN) continue;
            Map<String, Boolean> perms = new LinkedHashMap<>();
            for (Permission perm : Permission.values()) {
                perms.put(perm.name(), index.getOrDefault(role.name(), Map.of())
                        .getOrDefault(perm.name(), false));
            }
            matrix.put(role.name(), perms);
        }
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK", matrix));
    }

    /**
     * PUT /api/admin/permissions/{role}
     * Body: { "POLL_VIEW": true, "NOTICE_MANAGE": false, … }
     * Updates or creates each supplied permission entry for the given role.
     */
    @PutMapping("/{roleName}")
    public ResponseEntity<UserDto.ApiResponse<Void>> updateRole(
            @PathVariable String roleName,
            @RequestBody Map<String, Boolean> changes) {
        Role role;
        try {
            role = Role.valueOf(roleName);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(UserDto.ApiResponse.error("Unknown role: " + roleName));
        }
        if (role == Role.ADMIN) {
            return ResponseEntity.badRequest()
                    .body(UserDto.ApiResponse.error("ADMIN permissions cannot be modified"));
        }

        for (Map.Entry<String, Boolean> entry : changes.entrySet()) {
            Permission perm;
            try {
                perm = Permission.valueOf(entry.getKey());
            } catch (IllegalArgumentException e) {
                continue; // skip unknown permissions silently
            }

            RolePermission rp = repo.findByRoleAndPermission(role, perm)
                    .orElse(RolePermission.builder().role(role).permission(perm).build());
            rp.setGranted(entry.getValue());
            repo.save(rp);
        }
        return ResponseEntity.ok(UserDto.ApiResponse.success("Permissions updated", null));
    }
}