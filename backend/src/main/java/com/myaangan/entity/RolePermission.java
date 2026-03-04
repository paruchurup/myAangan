package com.myaangan.entity;

import com.myaangan.enums.Permission;
import com.myaangan.enums.Role;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "role_permissions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"role", "permission"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RolePermission {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Permission permission;

    @Column(nullable = false)
    private boolean granted;
}
