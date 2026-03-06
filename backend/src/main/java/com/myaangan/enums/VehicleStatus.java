package com.myaangan.enums;
public enum VehicleStatus {
    PENDING,    // Awaiting admin approval
    APPROVED,   // Active — can use parking
    REJECTED,   // Admin rejected registration
    SUSPENDED   // Temporarily barred (violation)
}
