package com.myaangan.enums;

/**
 * All feature permissions in the system.
 * Stored in role_permissions table — Admin can toggle per role.
 * ADMIN role always has all permissions (enforced in PermissionService).
 */
public enum Permission {

    // ── Delivery ─────────────────────────────────────────────────────────────
    DELIVERY_LOG,            // Log a new delivery (Guard)
    DELIVERY_VIEW_ALL,       // See all deliveries (Guard/Admin)
    DELIVERY_VIEW_OWN,       // See own pending/history (Resident)
    DELIVERY_PREFERENCES,    // Set DND, preferred collector (Resident)
    DELIVERY_OTP_RESIDENT,   // Generate OTP as resident side

    // ── Complaints ────────────────────────────────────────────────────────────
    COMPLAINT_RAISE,         // Raise a new complaint
    COMPLAINT_VIEW_OWN,      // View own complaints
    COMPLAINT_VIEW_ALL,      // View all society complaints
    COMPLAINT_MANAGE,        // Acknowledge / update status / assign (FM/BM/BDA)
    COMPLAINT_INTERNAL_NOTE, // Add internal notes hidden from residents
    COMPLAINT_ESCALATE,      // Manually escalate a complaint
    COMPLAINT_PDF,           // Download PDF report for BDA submission

    // ── Services Directory ────────────────────────────────────────────────────
    SERVICE_VIEW,            // Browse service providers
    SERVICE_ADD,             // Add a new service provider listing
    SERVICE_REVIEW,          // Leave a review on a provider
    SERVICE_MANAGE,          // Approve / reject / delete providers (Admin)

    // ── Polls & Voting ────────────────────────────────────────────────────────
    POLL_VIEW,     // View and participate in polls
    POLL_VOTE,     // Cast votes on polls
    POLL_MANAGE,   // Create, edit, publish, close polls

    // ── User Management ───────────────────────────────────────────────────────
    USER_MANAGE,             // Admin: approve, change roles, manage users
}
