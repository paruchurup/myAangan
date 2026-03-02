package com.myaangan.dto;

import com.myaangan.entity.User;
import lombok.Data;

@Data
public class DeliveryPreferencesResponse {
    private String deliveryNote;
    private String preferredCollector;
    private String dndStart;
    private String dndEnd;
    private String defaultCollectorName;
    private boolean dndActive;   // true if current time falls within DND window

    public static DeliveryPreferencesResponse from(User u) {
        DeliveryPreferencesResponse r = new DeliveryPreferencesResponse();
        r.setDeliveryNote(u.getDeliveryNote());
        r.setPreferredCollector(u.getPreferredCollector());
        r.setDndStart(u.getDndStart());
        r.setDndEnd(u.getDndEnd());
        r.setDefaultCollectorName(u.getDefaultCollectorName());
        r.setDndActive(isDndActive(u.getDndStart(), u.getDndEnd()));
        return r;
    }

    private static boolean isDndActive(String start, String end) {
        if (start == null || end == null) return false;
        try {
            java.time.LocalTime now  = java.time.LocalTime.now();
            java.time.LocalTime s    = java.time.LocalTime.parse(start);
            java.time.LocalTime e    = java.time.LocalTime.parse(end);
            return s.isBefore(e) ? (!now.isBefore(s) && now.isBefore(e))
                                 : (!now.isBefore(s) || now.isBefore(e)); // crosses midnight
        } catch (Exception ex) { return false; }
    }
}
