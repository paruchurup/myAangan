package com.myaangan.enums;
public enum BillStatus {
    UNPAID,           // Generated, not yet paid
    PAID,             // Fully paid via Razorpay
    WAIVED,           // Admin waived the bill
    PARTIALLY_PAID    // Safety valve — partial payment recorded manually
}
