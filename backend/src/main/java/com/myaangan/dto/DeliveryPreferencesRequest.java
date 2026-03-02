package com.myaangan.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DeliveryPreferencesRequest {

    @Size(max = 500, message = "Note must be under 500 characters")
    private String deliveryNote;

    @Size(max = 100, message = "Preferred collector name too long")
    private String preferredCollector;

    // HH:mm format, nullable = clear the DND window
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$",
             message = "Time must be in HH:mm format (e.g. 14:00)")
    private String dndStart;

    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$",
             message = "Time must be in HH:mm format (e.g. 16:00)")
    private String dndEnd;

    @Size(max = 100, message = "Default collector name too long")
    private String defaultCollectorName;
}
