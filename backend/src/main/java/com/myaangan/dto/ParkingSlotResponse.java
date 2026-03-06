package com.myaangan.dto;

import com.myaangan.enums.SlotStatus;
import com.myaangan.enums.SlotType;
import com.myaangan.enums.VehicleType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class ParkingSlotResponse {
    private Long id;
    private String block;
    private String slotNumber;
    private String level;
    private SlotType type;
    private SlotStatus status;
    private String notes;
    private String label;               // "A · 03 · Ground"

    // All vehicles assigned to this slot
    private List<VehicleInfo> vehicles;

    private LocalDateTime createdAt;

    @Data @Builder
    public static class VehicleInfo {
        private Long id;
        private String plate;
        private VehicleType type;
        private String description;     // "Red Maruti Swift"
        private String ownerName;
        private String ownerFlat;
    }
}
