package com.myaangan.dto;

import com.myaangan.enums.ViolationType;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ParkingViolationRequest {
    @NotBlank @Size(max = 20)
    private String plateNumber;

    private Long vehicleId;     // null if unregistered

    private Long slotId;

    @NotNull
    private ViolationType violationType;

    @NotBlank @Size(max = 1000)
    private String description;
}
