package com.myaangan.dto;

import lombok.Data;

@Data
public class ProviderUpdateRequest {
    private String name;
    private String phone;
    private Long categoryId;
    private String area;
    private String availability;    // AVAILABLE | BUSY | NOT_RESPONDING
}
