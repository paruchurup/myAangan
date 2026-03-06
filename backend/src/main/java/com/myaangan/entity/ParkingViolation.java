package com.myaangan.entity;

import com.myaangan.enums.ViolationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "parking_violations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ParkingViolation {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Can be a registered vehicle OR a free-text plate for unknown vehicles
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;            // null if unregistered vehicle

    @Column(length = 20)
    private String plateNumber;         // always stored for reference

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "slot_id")
    private ParkingSlot slot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ViolationType violationType;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(length = 500)
    private String photoPath;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reported_by_id", nullable = false)
    private User reportedBy;

    @Column(nullable = false)
    @Builder.Default
    private boolean resolved = false;

    @Column(length = 500)
    private String resolutionNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_id")
    private User resolvedBy;

    private LocalDateTime resolvedAt;

    @CreationTimestamp private LocalDateTime reportedAt;
}
