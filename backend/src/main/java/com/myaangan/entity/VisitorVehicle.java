package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "visitor_vehicles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VisitorVehicle {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String plateNumber;

    @Column(length = 30)
    private String vehicleDescription;  // "White Honda City"

    @Column(nullable = false, length = 10)
    private String hostFlat;            // which flat they're visiting

    @Column(nullable = false, length = 100)
    private String visitorName;

    @Column(nullable = false, length = 20)
    private String visitorPhone;

    // Slot assigned (usually a visitor slot)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "slot_id")
    private ParkingSlot slot;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "logged_by_id", nullable = false)
    private User loggedBy;

    private LocalDateTime exitedAt;     // null = still in premises

    @Column(length = 200)
    private String notes;

    @CreationTimestamp private LocalDateTime enteredAt;
}
