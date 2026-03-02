package com.myaangan.entity;

import com.myaangan.enums.DeliveryStatus;
import com.myaangan.enums.DeliveryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Delivery {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Who it's for ──────────────────────────────────────────────────────────
    // Resident identified by flat number (guard types this at gate)
    @Column(nullable = false)
    private String flatNumber;

    private String block;   // optional — some societies have blocks A/B/C

    // Resolved resident (nullable — might not find a match if flat number wrong)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "resident_id")
    private User resident;

    // ── Delivery details ──────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    
    @Column(nullable = false)
    @Builder.Default
    private DeliveryType deliveryType = DeliveryType.OTHER;

    private String senderName;      // e.g. "Amazon", "Swiggy"
    private String description;     // e.g. "2 boxes", "envelope"

    // ── Status ────────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DeliveryStatus status = DeliveryStatus.ARRIVED;

    private LocalDateTime notifiedAt;
    private LocalDateTime collectedAt;

    // Who collected — name of person (could be resident, family, etc.)
    private String collectedBy;

    // Guard who logged it
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "logged_by_id", nullable = false)
    private User loggedBy;

    // Optional note from resident (e.g. "Wife will collect")
    private String residentNote;

    // ── OTP Collection Verification (Phase 3B) ────────────────────────────────
    // BCrypt-hashed OTP — never stored in plaintext
    private String otpHash;

    // Who initiated the OTP: "GUARD" or "RESIDENT"
    private String otpInitiatedBy;

    // OTP expires 10 minutes after generation
    private LocalDateTime otpExpiresAt;

    // True once OTP has been successfully used
    @Column(nullable = false)
    @Builder.Default
    private boolean otpVerified = false;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
}
