package com.myaangan.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OtpGenerateResponse {
    private String otp;           // plaintext — shown once, never stored
    private String initiatedBy;   // "GUARD" or "RESIDENT"
    private String expiresAt;     // ISO datetime string
    private Long   deliveryId;
}
