package com.myaangan.dto;

import com.myaangan.enums.DeliveryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeliveryRequest {

    @NotBlank(message = "Flat number is required")
    private String flatNumber;

    private String block;

    @NotNull(message = "Delivery type is required")
    private DeliveryType deliveryType;

    private String senderName;      // e.g. Amazon, Swiggy
    private String description;     // e.g. "2 boxes"
}
