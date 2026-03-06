package com.myaangan.entity;

import com.myaangan.enums.SlotStatus;
import com.myaangan.enums.SlotType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "parking_slots",
    uniqueConstraints = @UniqueConstraint(columnNames = {"block", "slot_number"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ParkingSlot {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 5)
    private String block;           // A, B, Basement, G

    @Column(nullable = false, length = 10, name = "slot_number")
    private String slotNumber;      // 01, 02, B-01

    @Column(length = 20)
    private String level;           // Ground, B1, B2, 1st Floor

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SlotType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private SlotStatus status = SlotStatus.AVAILABLE;

    // Vehicles assigned to this slot: max 1 CAR, unlimited BIKE/SCOOTER
    @OneToMany(mappedBy = "assignedSlot", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Vehicle> assignedVehicles = new ArrayList<>();

    @Column(length = 500)
    private String notes;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
}
