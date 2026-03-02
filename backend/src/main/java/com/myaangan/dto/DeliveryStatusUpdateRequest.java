package com.myaangan.dto;

import com.myaangan.enums.DeliveryStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeliveryStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private DeliveryStatus status;   // COLLECTED or RETURNED

    private String collectedBy;      // name of person collecting
    private String residentNote;     // resident's note
}
