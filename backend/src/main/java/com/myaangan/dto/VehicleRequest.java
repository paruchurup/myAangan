package com.myaangan.dto;

import com.myaangan.enums.VehicleType;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class VehicleRequest {
    @NotBlank @Size(max = 20)
    private String plateNumber;

    @NotNull
    private VehicleType type;

    @NotBlank @Size(max = 50)
    private String make;

    @NotBlank @Size(max = 50)
    private String model;

    @Size(max = 30)
    private String colour;

    @Size(max = 20)
    private String year;
}
