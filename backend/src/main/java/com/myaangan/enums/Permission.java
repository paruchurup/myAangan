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

    // ── Notices & Announcements ──────────────────────────────────────────────
    NOTICE_VIEW,    // Read published notices
    NOTICE_MANAGE,  // Create, publish, archive notices

    // ── Vehicle & Parking ─────────────────────────────────────────────────────
    VEHICLE_REGISTER,    // Resident: register own vehicle
    VEHICLE_VIEW_ALL,    // Guard/Admin: see all registered vehicles
    VEHICLE_MANAGE,      // Admin/FM: approve, reject, suspend vehicles
    PARKING_MANAGE,      // Admin: create/assign/manage parking slots
    VISITOR_VEHICLE_LOG, // Guard: log visitor vehicles in/out + report violations
    VISITOR_PASS_CREATE,    // Resident creates/manages visitor pre-approval passes
    VISITOR_PASS_MANAGE,    // FM/Admin manages all passes

    MAINTENANCE_PAY,        // Resident pays own maintenance bill
    MAINTENANCE_VIEW,       // Resident views own bills and receipts
    MAINTENANCE_MANAGE,     // Admin/FM manages config, waives bills, views all

    ANALYTICS_VIEW,         // View society analytics dashboard

    // ── Events & Community ───────────────────────────────────────────────────
    EVENT_CREATE,           // Create and manage events (President/Secretary/FM)
    EVENT_VOTE,             // Vote to approve/reject events and surplus
    EVENT_VOLUNTEER,        // Sign up as volunteer for event roles
    EVENT_CONTRIBUTE,       // Make monetary or in-kind contribution
    EVENT_EXPENSE,          // Log expenses (volunteers)
    EVENT_PHOTO,            // Upload event gallery photos (volunteers/organisers)
    EVENT_VIEW,             // View event details, budget, expenses

    //-─ Helpdesk & Service Requests ─────────────────────────────────────────────
    HELPDESK_CREATE,        // Raise a service request (all residents)
    HELPDESK_VIEW_OWN,      // View own requests
    HELPDESK_MANAGE,        // FM: view all, assign, update status
    HELPDESK_RAISE,         // Resident raises a service request


    // ── User Management ───────────────────────────────────────────────────────
    USER_MANAGE,             // Admin: approve, change roles, manage users
}
