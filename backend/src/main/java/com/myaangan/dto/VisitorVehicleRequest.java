package com.myaangan.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class VisitorVehicleRequest {
    @NotBlank @Size(max = 20)
    private String plateNumber;

    @Size(max = 30)
    private String vehicleDescription;

    @NotBlank @Size(max = 10)
    private String hostFlat;

    @NotBlank @Size(max = 100)
    private String visitorName;

    @NotBlank @Size(max = 20)
    private String visitorPhone;

    private Long slotId;    // optional visitor slot assignment

    @Size(max = 200)
    private String notes;
}
