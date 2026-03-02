package com.myaangan.enums;

public enum ComplaintCategory {
    WATER_PLUMBING,
    ELECTRICAL,
    SECURITY,
    LIFT_ELEVATOR,
    CLEANING_HOUSEKEEPING,
    STRUCTURAL_LEAKAGE,
    COMMON_AREA_PARKING,
    OTHER;

    public String getLabel() {
        return switch (this) {
            case WATER_PLUMBING       -> "💧 Water / Plumbing";
            case ELECTRICAL           -> "⚡ Electrical";
            case SECURITY             -> "🔒 Security";
            case LIFT_ELEVATOR        -> "🛗 Lift / Elevator";
            case CLEANING_HOUSEKEEPING-> "🧹 Cleaning / Housekeeping";
            case STRUCTURAL_LEAKAGE   -> "🏗️ Structural / Leakage";
            case COMMON_AREA_PARKING  -> "🅿️ Common Area / Parking";
            case OTHER                -> "📋 Other";
        };
    }
}
