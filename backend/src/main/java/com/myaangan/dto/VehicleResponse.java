package com.myaangan.dto;

import com.myaangan.enums.VehicleStatus;
import com.myaangan.enums.VehicleType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class VehicleResponse {
    private Long id;
    private String plateNumber;
    private VehicleType type;
    private String make;
    private String model;
    private String colour;
    private String year;
    private VehicleStatus status;
    private String adminNote;
    private String photoUrl;

    // Owner info
    private String ownerName;
    private String ownerFlat;
    private String ownerBlock;
    private String ownerPhone;

    // Assigned slot
    private Long assignedSlotId;
    private String assignedSlotLabel;   // e.g. "Block A · Slot 03 · Ground"

    // Violation count
    private long violationCount;

    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
}
