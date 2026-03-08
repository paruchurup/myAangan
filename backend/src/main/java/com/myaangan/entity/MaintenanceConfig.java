package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Single-row configuration table for the maintenance fee module.
 * Always has exactly one row (id = 1). Updated by Admin from the config panel.
 */
@Entity
@Table(name = "maintenance_config")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MaintenanceConfig {

    @Id
    private Long id = 1L;

    /** Monthly base amount charged to every flat. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyAmount;

    /** Day of month when bills are considered overdue and penalty kicks in (1–28). */
    @Column(nullable = false)
    private Integer dueDayOfMonth;

    /** One-time flat penalty added the day after due date (e.g. ₹500). */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal latePenaltyFlat;

    /** Monthly interest rate as a percentage of base amount (e.g. 2.0 = 2%). */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal lateInterestPct;

    /** Razorpay key_id (public key — safe to return to frontend). */
    @Column(length = 100)
    private String razorpayKeyId;

    /** Razorpay key_secret (never returned to frontend). */
    @Column(length = 100)
    private String razorpayKeySecret;

    /** Society name printed on receipts. */
    @Column(length = 200)
    private String societyName;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
