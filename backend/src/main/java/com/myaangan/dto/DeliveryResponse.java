package com.myaangan.dto;

import com.myaangan.entity.Delivery;
import com.myaangan.entity.User;
import com.myaangan.enums.DeliveryStatus;
import com.myaangan.enums.DeliveryType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeliveryResponse {
    private Long id;
    private String flatNumber;
    private String block;
    private String residentName;
    private Long residentId;
    private boolean residentFound;

    private DeliveryType deliveryType;
    private String deliveryTypeLabel;
    private String senderName;
    private String description;

    private DeliveryStatus status;
    private String statusLabel;

    private String loggedByName;
    private String collectedBy;
    private String residentNote;

    // OTP state
    private boolean otpPending;      // OTP generated but not yet verified
    private String  otpInitiatedBy;  // "GUARD" or "RESIDENT"
    private boolean otpVerified;

    // Resident delivery preferences (shown to guard)
    private String residentDeliveryNote;
    private String residentPreferredCollector;
    private String residentDefaultCollector;
    private boolean residentDndActive;
    private String  residentDndWindow;  // e.g. "14:00 – 16:00"

    private LocalDateTime createdAt;
    private LocalDateTime notifiedAt;
    private LocalDateTime collectedAt;

    public static DeliveryResponse from(Delivery d) {
        DeliveryResponse r = new DeliveryResponse();
        r.setId(d.getId());
        r.setFlatNumber(d.getFlatNumber());
        r.setBlock(d.getBlock());

        if (d.getResident() != null) {
            r.setResidentFound(true);
            r.setResidentId(d.getResident().getId());
            r.setResidentName(d.getResident().getFirstName() + " "
                + d.getResident().getLastName());
        } else {
            r.setResidentFound(false);
            r.setResidentName("Unknown");
        }

        r.setDeliveryType(d.getDeliveryType());
        r.setDeliveryTypeLabel(typeLabel(d.getDeliveryType().name()));
        r.setSenderName(d.getSenderName());
        r.setDescription(d.getDescription());

        r.setStatus(d.getStatus());
        r.setStatusLabel(statusLabel(d.getStatus().name()));

        r.setLoggedByName(d.getLoggedBy().getFirstName() + " "
            + d.getLoggedBy().getLastName());
        r.setCollectedBy(d.getCollectedBy());
        r.setResidentNote(d.getResidentNote());

        // OTP state
        boolean otpPending = d.getOtpHash() != null && !d.isOtpVerified()
            && d.getOtpExpiresAt() != null
            && d.getOtpExpiresAt().isAfter(java.time.LocalDateTime.now());
        r.setOtpPending(otpPending);
        r.setOtpInitiatedBy(d.getOtpInitiatedBy());
        r.setOtpVerified(d.isOtpVerified());

        // Resident preferences (if resident linked)
        if (d.getResident() != null) {
            User res = d.getResident();
            r.setResidentDeliveryNote(res.getDeliveryNote());
            r.setResidentPreferredCollector(res.getPreferredCollector());
            r.setResidentDefaultCollector(res.getDefaultCollectorName());
            r.setResidentDndActive(DeliveryPreferencesResponse.from(res).isDndActive());
            if (res.getDndStart() != null && res.getDndEnd() != null) {
                r.setResidentDndWindow(res.getDndStart() + " – " + res.getDndEnd());
            }
        }

        r.setCreatedAt(d.getCreatedAt());
        r.setNotifiedAt(d.getNotifiedAt());
        r.setCollectedAt(d.getCollectedAt());
        return r;
    }

    private static String typeLabel(String type) {
        return switch (type) {
            case "FOOD"     -> "🍔 Food";
            case "PARCEL"   -> "📦 Parcel";
            case "COURIER"  -> "✉️ Courier";
            case "DOCUMENT" -> "📄 Document";
            default         -> "📬 Other";
        };
    }

    private static String statusLabel(String status) {
        return switch (status) {
            case "ARRIVED"   -> "🔔 Arrived";
            case "NOTIFIED"  -> "👀 Notified";
            case "COLLECTED" -> "✅ Collected";
            case "RETURNED"  -> "↩️ Returned";
            default          -> status;
        };
    }
}
