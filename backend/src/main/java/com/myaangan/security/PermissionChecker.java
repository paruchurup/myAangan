package com.myaangan.security;

import com.myaangan.enums.Role;
import com.myaangan.repository.RolePermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * Spring bean named "perm" — used in @PreAuthorize expressions:
 *   @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_VIEW')")
 *
 * Reads the user's role from the JWT-granted authority and checks
 * the role_permissions table for the requested permission.
 */
@Component("perm")
@RequiredArgsConstructor
public class PermissionChecker {

    private final RolePermissionRepository rolePermissionRepository;

    /**
     * Returns true if the authenticated user has the given permission.
     * ADMIN always returns true (handled by the hasRole check before this,
     * but we guard here too for safety).
     */
    public boolean has(Authentication auth, String permission) {
        if (auth == null || !auth.isAuthenticated()) return false;

        String roleAuthority = auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a.startsWith("ROLE_"))
                .findFirst()
                .orElse(null);

        if (roleAuthority == null) return false;
        if ("ROLE_ADMIN".equals(roleAuthority)) return true;

        try {
            Role role = Role.valueOf(roleAuthority.substring(5)); // strip "ROLE_"
            return rolePermissionRepository
                    .findGrantedPermissionsByRole(role)
                    .stream()
                    .anyMatch(p -> p.name().equals(permission));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}