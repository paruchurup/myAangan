package com.myaangan.enums;
public enum ServiceRequestStatus {
    PENDING,      // Just raised by resident
    ASSIGNED,     // FM assigned staff + confirmed slot
    IN_PROGRESS,  // Work underway
    DONE,         // Completed
    CANCELLED     // Cancelled by resident or FM
}
