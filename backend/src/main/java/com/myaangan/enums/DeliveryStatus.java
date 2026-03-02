package com.myaangan.enums;

public enum DeliveryStatus {
    ARRIVED,        // Guard logged it, resident not yet notified/acknowledged
    NOTIFIED,       // Resident has seen it in app
    COLLECTED,      // Resident/someone collected it
    RETURNED        // Sent back — resident didn't collect
}
