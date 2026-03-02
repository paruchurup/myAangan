package com.myaangan.entity;

import com.myaangan.enums.Role;
import com.myaangan.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(unique = true)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.PENDING_APPROVAL;

    // For residents: flat/apartment details
    private String flatNumber;
    private String block;
    private String societyName;

    // For visitors: their host (resident) reference
    private String hostFlatNumber;

    // ── Delivery Preferences (Phase 3B) ───────────────────────────────────────
    // Free-text note shown to guard on delivery card
    @Column(length = 500)
    private String deliveryNote;

    // Preferred person to collect (shown as hint to guard)
    private String preferredCollector;

    // Do-not-disturb window — stored as "HH:mm" strings for simplicity
    private String dndStart;   // e.g. "14:00"
    private String dndEnd;     // e.g. "16:00"

    // Pre-fills guard's "Collected by" quick-pick
    private String defaultCollectorName;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;
}
