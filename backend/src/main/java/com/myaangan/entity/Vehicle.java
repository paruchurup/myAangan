package com.myaangan.entity;

import com.myaangan.enums.VehicleStatus;
import com.myaangan.enums.VehicleType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Vehicle {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 20, unique = true)
    private String plateNumber;     // e.g. KA01AB1234

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private VehicleType type;

    @Column(nullable = false, length = 50)
    private String make;            // e.g. Maruti

    @Column(nullable = false, length = 50)
    private String model;           // e.g. Swift

    @Column(length = 30)
    private String colour;

    @Column(length = 20)
    private String year;

    @Column(length = 500)
    private String photoPath;       // stored on disk

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private VehicleStatus status = VehicleStatus.PENDING;

    @Column(length = 500)
    private String adminNote;       // rejection / suspension reason

    // Currently assigned slot (null if none)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_slot_id")
    private ParkingSlot assignedSlot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    private LocalDateTime approvedAt;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
}
