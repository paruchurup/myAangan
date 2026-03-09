package com.myaangan.service;

import com.google.firebase.messaging.*;
import com.myaangan.config.FcmConfig;
import com.myaangan.entity.*;
import com.myaangan.enums.NotificationType;
import com.myaangan.enums.Role;
import com.myaangan.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository  notifRepo;
    private final FcmTokenRepository      tokenRepo;
    private final UserRepository          userRepo;
    private final FcmConfig               fcmConfig;

    // ── Send to specific user ─────────────────────────────────────────────

    public void sendToUser(String userEmail, NotificationType type,
                            String title, String body, String entityRef) {
        User user = userRepo.findByEmail(userEmail).orElse(null);
        if (user == null) return;
        saveAndPush(List.of(user), type, title, body, entityRef);
    }

    // ── Send to roles ─────────────────────────────────────────────────────

    public void sendToRoles(List<Role> roles, NotificationType type,
                             String title, String body, String entityRef) {
        List<User> users = userRepo.findAll().stream()
            .filter(u -> roles.contains(u.getRole()))
            .collect(Collectors.toList());
        saveAndPush(users, type, title, body, entityRef);
    }

    public void sendToAllResidents(NotificationType type,
                                    String title, String body, String entityRef) {
        sendToRoles(List.of(Role.RESIDENT, Role.VOLUNTEER, Role.PRESIDENT,
            Role.SECRETARY, Role.FACILITY_MANAGER, Role.ADMIN), type, title, body, entityRef);
    }

    // ── Convenience triggers ──────────────────────────────────────────────

    public void visitorArrived(String residentEmail, String visitorName, Long visitorId) {
        sendToUser(residentEmail, NotificationType.VISITOR_ARRIVED,
            "Visitor Arrived 🚪", visitorName + " has arrived at the gate.", "VISITOR:" + visitorId);
        sendToRoles(List.of(Role.ADMIN, Role.FACILITY_MANAGER, Role.SECURITY_GUARD),
            NotificationType.VISITOR_ARRIVED, "Gate Entry", visitorName + " → " + residentEmail, "VISITOR:" + visitorId);
    }

    public void deliveryOtp(String residentEmail, String deliveryPerson, Long deliveryId) {
        sendToUser(residentEmail, NotificationType.DELIVERY_OTP,
            "Delivery OTP 📦", "OTP generated for delivery from " + deliveryPerson + ". Share only with delivery person.", "DELIVERY:" + deliveryId);
    }

    public void complaintStatusChanged(String residentEmail, String complaintTitle,
                                        String newStatus, Long complaintId) {
        sendToUser(residentEmail, NotificationType.COMPLAINT_STATUS,
            "Complaint Update 📋", "Your complaint '" + complaintTitle + "' is now " + newStatus + ".", "COMPLAINT:" + complaintId);
    }

    public void maintenanceBillGenerated(String residentEmail, String month, double amount, Long billId) {
        sendToUser(residentEmail, NotificationType.MAINTENANCE_BILL,
            "Maintenance Bill 🧾", "Your bill for " + month + " of ₹" + String.format("%.0f", amount) + " has been generated.", "MAINTENANCE:" + billId);
    }

    public void maintenancePaymentConfirmed(String residentEmail, String month, Long billId) {
        sendToUser(residentEmail, NotificationType.MAINTENANCE_PAYMENT,
            "Payment Confirmed ✅", "Maintenance payment for " + month + " received. Thank you!", "MAINTENANCE:" + billId);
    }

    public void noticePosted(String noticeTitle, Long noticeId) {
        sendToAllResidents(NotificationType.NOTICE_POSTED, "New Notice 📢", noticeTitle, "NOTICE:" + noticeId);
    }

    public void pollOpened(String pollTitle, Long pollId) {
        sendToAllResidents(NotificationType.POLL_OPENED, "New Poll 🗳️", "Vote now: " + pollTitle, "POLL:" + pollId);
    }

    public void pollClosed(String pollTitle, Long pollId) {
        sendToAllResidents(NotificationType.POLL_CLOSED, "Poll Closed 🗳️", "Results ready: " + pollTitle, "POLL:" + pollId);
    }

    public void eventVotingOpened(String eventTitle, Long eventId) {
        sendToAllResidents(NotificationType.EVENT_VOTING_OPENED, "Event Vote Open 🎉", "Cast your vote: " + eventTitle, "EVENT:" + eventId);
    }

    public void helpdeskStatusChanged(String residentEmail, String requestTitle,
                                       String newStatus, Long requestId) {
        sendToUser(residentEmail, NotificationType.HELPDESK_STATUS,
            "Service Request Update 🛠️", "Your request '" + requestTitle + "' is now " + newStatus + ".", "HELPDESK:" + requestId);
        sendToRoles(List.of(Role.ADMIN, Role.FACILITY_MANAGER),
            NotificationType.HELPDESK_STATUS, "Helpdesk Update", requestTitle + " → " + newStatus, "HELPDESK:" + requestId);
    }

    public void nocFulfilled(String residentEmail, String purpose, Long docId) {
        sendToUser(residentEmail, NotificationType.NOC_FULFILLED,
            "NOC Ready 📜", "Your NOC for '" + purpose + "' is ready to download.", "VAULT:" + docId);
    }

    public void nocRejected(String residentEmail, String purpose, String reason) {
        sendToUser(residentEmail, NotificationType.NOC_REJECTED,
            "NOC Request Rejected ❌",
            "Your NOC for '" + purpose + "' was rejected" + (reason != null ? ": " + reason : "."), null);
    }

    // ── FCM token ─────────────────────────────────────────────────────────

    public void registerToken(String email, String token) {
        User user = userRepo.findByEmail(email).orElseThrow();
        tokenRepo.findByUserEmailAndToken(email, token)
            .ifPresentOrElse(t -> {}, () ->
                tokenRepo.save(FcmToken.builder().user(user).token(token).build()));
    }

    public void removeToken(String token) { tokenRepo.deleteByToken(token); }

    // ── Queries ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getNotifications(String email, int page) {
        var pg = notifRepo.findByUserEmailOrderByCreatedAtDesc(email, PageRequest.of(page, 20));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("notifications", pg.getContent());
        m.put("unreadCount",   notifRepo.countByUserEmailAndIsReadFalse(email));
        m.put("totalPages",    pg.getTotalPages());
        m.put("currentPage",   page);
        return m;
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        return notifRepo.countByUserEmailAndIsReadFalse(email);
    }

    public int markAllRead(String email)  { return notifRepo.markAllRead(email); }

    public void markRead(Long id, String email) {
        notifRepo.findById(id).ifPresent(n -> {
            if (n.getUser().getEmail().equals(email)) { n.setIsRead(true); notifRepo.save(n); }
        });
    }

    // ── Nightly cleanup ───────────────────────────────────────────────────

    @Scheduled(cron = "0 0 2 * * *")
    public void cleanup() {
        int d = notifRepo.deleteOlderThan(LocalDateTime.now().minusDays(7));
        log.info("Notification cleanup: {} old records deleted", d);
    }

    // ── Internals ─────────────────────────────────────────────────────────

    private void saveAndPush(List<User> users, NotificationType type,
                              String title, String body, String entityRef) {
        if (users.isEmpty()) return;
        notifRepo
                .saveAll(users.stream()
            .map(u -> com.myaangan.entity.Notification.builder().user(u).type(type)
                .title(title).body(body).entityRef(entityRef).isRead(false).build())
            .collect(Collectors.toList()));

        if (!fcmConfig.isConfigured()) return;
        List<Long> ids = users.stream().map(User::getId).collect(Collectors.toList());
        List<String> tokens = tokenRepo.findByUserIds(ids).stream()
            .map(FcmToken::getToken).collect(Collectors.toList());
        if (!tokens.isEmpty()) pushFcm(tokens, title, body, type.name(), entityRef);
    }

    private void pushFcm(List<String> tokens, String title, String body,
                          String type, String entityRef) {
        try {
            Map<String, String> data = new HashMap<>();
            data.put("type", type);
            if (entityRef != null) data.put("entityRef", entityRef);

            for (int i = 0; i < tokens.size(); i += 500) {
                List<String> batch = tokens.subList(i, Math.min(i + 500, tokens.size()));
                MulticastMessage msg = MulticastMessage.builder()
                    .setNotification(com.google.firebase.messaging.Notification.builder()
                        .setTitle(title).setBody(body).build())
                    .putAllData(data).addAllTokens(batch)
                    .setAndroidConfig(AndroidConfig.builder().setPriority(AndroidConfig.Priority.HIGH).build())
                    .setApnsConfig(ApnsConfig.builder().setAps(Aps.builder().setSound("default").build()).build())
                    .build();
                BatchResponse resp = FirebaseMessaging.getInstance().sendEachForMulticast(msg);
                log.info("FCM: {}/{} delivered", resp.getSuccessCount(), batch.size());

                // Purge dead tokens
                for (int j = 0; j < resp.getResponses().size(); j++) {
                    SendResponse sr = resp.getResponses().get(j);
                    if (!sr.isSuccessful() && sr.getException() != null) {
                        var code = sr.getException().getMessagingErrorCode();
                        if (code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT)
                            tokenRepo.deleteByToken(batch.get(j));
                    }
                }
            }
        } catch (FirebaseMessagingException e) {
            log.warn("FCM push failed: {}", e.getMessage());
        }
    }
}
