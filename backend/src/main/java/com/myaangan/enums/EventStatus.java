package com.myaangan.enums;
public enum EventStatus {
    DRAFT,          // Created, not yet open for voting
    VOTING,         // Approval vote is open to residents
    APPROVED,       // Quorum met, majority YES — event is confirmed
    REJECTED,       // Vote failed (quorum not met or majority NO)
    ACTIVE,         // Event day — contributions & expenses live
    COMPLETED,      // Event done, awaiting surplus vote
    SURPLUS_VOTE,   // Surplus disposition vote is open
    SETTLED,        // Final balance settled
    CANCELLED       // Cancelled by organiser
}
