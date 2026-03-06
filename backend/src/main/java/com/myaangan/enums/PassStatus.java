package com.myaangan.enums;
public enum PassStatus {
    ACTIVE,     // Pass is live and can be used
    USED,       // ONE_TIME pass has been checked in
    EXPIRED,    // Past valid date/end-date
    CANCELLED   // Resident manually cancelled
}
