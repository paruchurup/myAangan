package com.myaangan.repository;

import com.myaangan.entity.RolePermission;
import com.myaangan.enums.Permission;
import com.myaangan.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    List<RolePermission> findByRole(Role role);

    Optional<RolePermission> findByRoleAndPermission(Role role, Permission permission);

    // All granted permissions for a role — used at login / cache fill
    @Query("SELECT rp.permission FROM RolePermission rp WHERE rp.role = :role AND rp.granted = true")
    Set<Permission> findGrantedPermissionsByRole(Role role);

    // All rows — for admin permission grid
    @Query("SELECT rp FROM RolePermission rp ORDER BY rp.role, rp.permission")
    List<RolePermission> findAllOrdered();
}
