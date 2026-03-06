package com.myaangan.dto;

import com.myaangan.enums.SlotStatus;
import com.myaangan.enums.SlotType;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ParkingSlotRequest {
    @NotBlank @Size(max = 5)
    private String block;

    @NotBlank @Size(max = 10)
    private String slotNumber;

    @Size(max = 20)
    private String level;

    @NotNull
    private SlotType type;

    private SlotStatus status = SlotStatus.AVAILABLE;

    private String notes;

    // Optional: assign vehicle immediately
    private Long vehicleId;
}
