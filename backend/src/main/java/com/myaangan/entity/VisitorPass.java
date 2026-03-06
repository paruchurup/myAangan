package com.myaangan.entity;

import com.myaangan.enums.PassStatus;
import com.myaangan.enums.PassType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "visitor_passes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VisitorPass {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 8-char alphanumeric token — used for QR + 6-digit display code. */
    @Column(nullable = false, unique = true, length = 8)
    private String token;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    // ── Visitor info ──────────────────────────────────────────────────────
    @Column(nullable = false, length = 100)
    private String visitorName;

    @Column(length = 20)
    private String visitorPhone;

    @Column(length = 100)
    private String purpose;            // e.g. "House help", "Plumber", "Guest"

    // ── Pass type & validity ──────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PassType passType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private PassStatus status = PassStatus.ACTIVE;

    // ONE_TIME fields
    private LocalDate validDate;       // the single allowed date
    private LocalTime windowStart;     // e.g. 10:00
    private LocalTime windowEnd;       // e.g. 14:00

    // STANDING fields
    /** Comma-separated day numbers: 1=Mon, 2=Tue … 7=Sun */
    @Column(length = 20)
    private String allowedDays;

    private LocalDate standingFrom;
    private LocalDate standingUntil;   // null = indefinite

    /** Daily window for standing passes (optional, same windowStart/windowEnd reused). */

    @Column(length = 300)
    private String notes;

    @OneToMany(mappedBy = "pass", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<VisitorPassLog> logs = new ArrayList<>();

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
}
