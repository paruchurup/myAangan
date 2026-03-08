package com.myaangan.service;

import com.myaangan.entity.*;
import com.myaangan.enums.*;
import com.myaangan.exception.ResourceNotFoundException;
import com.myaangan.repository.*;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class EventService {

    private final EventRepository              eventRepo;
    private final EventVoteRepository          voteRepo;
    private final EventVolunteerSlotRepository slotRepo;
    private final EventVolunteerSignupRepository signupRepo;
    private final EventContributionRepository  contribRepo;
    private final EventInKindContributionRepository inKindRepo;
    private final EventExpenseRepository       expenseRepo;
    private final EventPhotoRepository         photoRepo;
    private final EventSurplusVoteRepository   surplusVoteRepo;
    private final UserRepository               userRepo;
    private final MaintenanceConfigRepository  maintenanceCfgRepo; // reuse Razorpay config

    @Value("${app.upload.events.dir:/app/uploads/events}")
    private String eventsDir;

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1 — EVENT CREATION & APPROVAL
    // ═══════════════════════════════════════════════════════════════════════

    public Event createEvent(Map<String, Object> req, String creatorEmail) {
        User creator = findUser(creatorEmail);
        Event event = Event.builder()
            .name(str(req, "name"))
            .description(str(req, "description"))
            .eventDate(LocalDateTime.parse(str(req, "eventDate")))
            .venue(str(req, "venue"))
            .estimatedBudget(new BigDecimal(str(req, "estimatedBudget")))
            .quorumPct(Integer.parseInt(str(req, "quorumPct")))
            .voteDeadline(LocalDateTime.parse(str(req, "voteDeadline")))
            .status(EventStatus.DRAFT)
            .createdBy(creator)
            .build();
        event = eventRepo.save(event);

        // Save volunteer slots if provided
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> slots = (List<Map<String, Object>>) req.getOrDefault("volunteerSlots", List.of());
        for (Map<String, Object> slot : slots) {
            slotRepo.save(EventVolunteerSlot.builder()
                .event(event)
                .roleName(str(slot, "roleName"))
                .roleDescription(str(slot, "roleDescription"))
                .maxVolunteers(slot.containsKey("maxVolunteers") ? (Integer) slot.get("maxVolunteers") : 5)
                .build());
        }
        log.info("Event '{}' created by {}", event.getName(), creatorEmail);
        return event;
    }

    public Event openVoting(Long eventId, String email) {
        Event event = findEvent(eventId);
        assertOrganiser(event, email);
        if (event.getStatus() != EventStatus.DRAFT)
            throw new IllegalStateException("Only DRAFT events can be opened for voting.");
        event.setStatus(EventStatus.VOTING);
        return eventRepo.save(event);
    }

    public Event castApprovalVote(Long eventId, String choice, String voterEmail) {
        Event event = findEvent(eventId);
        if (event.getStatus() != EventStatus.VOTING)
            throw new IllegalStateException("Voting is not open for this event.");
        if (LocalDateTime.now().isAfter(event.getVoteDeadline()))
            throw new IllegalStateException("Voting deadline has passed.");

        User voter = findUser(voterEmail);
        if (voteRepo.findByEventIdAndVoterEmail(eventId, voterEmail).isPresent())
            throw new IllegalStateException("You have already voted on this event.");

        voteRepo.save(EventVote.builder()
            .event(event).voter(voter)
            .choice(EventVoteChoice.valueOf(choice.toUpperCase()))
            .build());
        return event;
    }

    /** Scheduled: check voting deadlines every 10 minutes */
    @Scheduled(fixedDelay = 600_000)
    public void processExpiredVotes() {
        eventRepo.findVotingExpired(LocalDateTime.now()).forEach(event -> {
            long totalResidents = userRepo.findByStatus(UserStatus.ACTIVE).stream()
                .filter(u -> u.getRole() == Role.RESIDENT).count();
            long yesVotes = voteRepo.countByEventIdAndChoice(event.getId(), EventVoteChoice.YES);
            long totalVotes = voteRepo.countByEventId(event.getId());

            // Quorum check: enough people voted AND majority said YES
            double participationPct = totalResidents > 0 ? (totalVotes * 100.0 / totalResidents) : 0;
            boolean quorumMet = participationPct >= event.getQuorumPct();
            boolean majorityYes = totalVotes > 0 && (yesVotes * 100.0 / totalVotes) > 50;

            event.setStatus(quorumMet && majorityYes ? EventStatus.APPROVED : EventStatus.REJECTED);
            eventRepo.save(event);
            log.info("Event '{}' voting closed: {} (participation={:.1f}%, yes={})",
                event.getName(), event.getStatus(), participationPct, yesVotes);
        });
    }

    public Event activateEvent(Long eventId, String email) {
        Event event = findEvent(eventId);
        assertOrganiser(event, email);
        if (event.getStatus() != EventStatus.APPROVED)
            throw new IllegalStateException("Only APPROVED events can be activated.");
        event.setStatus(EventStatus.ACTIVE);
        return eventRepo.save(event);
    }

    public Event completeEvent(Long eventId, String email) {
        Event event = findEvent(eventId);
        assertOrganiser(event, email);
        if (event.getStatus() != EventStatus.ACTIVE)
            throw new IllegalStateException("Only ACTIVE events can be completed.");
        event.setStatus(EventStatus.COMPLETED);
        return eventRepo.save(event);
    }

    public Event cancelEvent(Long eventId, String email) {
        Event event = findEvent(eventId);
        assertOrganiser(event, email);
        if (event.getStatus() == EventStatus.COMPLETED)
            throw new IllegalStateException("Completed events cannot be cancelled.");
        event.setStatus(EventStatus.CANCELLED);
        return eventRepo.save(event);
    }

    // ── Volunteer slots ────────────────────────────────────────────────────

    public EventVolunteerSignup signUpVolunteer(Long slotId, String email) {
        EventVolunteerSlot slot = slotRepo.findById(slotId)
            .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        if (slot.getEvent().getStatus() != EventStatus.APPROVED && slot.getEvent().getStatus() != EventStatus.ACTIVE)
            throw new IllegalStateException("Event is not open for volunteer signup.");
        if (signupRepo.findBySlotIdAndResidentEmail(slotId, email).isPresent())
            throw new IllegalStateException("You have already signed up for this role.");
        long current = signupRepo.countBySlotId(slotId);
        if (current >= slot.getMaxVolunteers())
            throw new IllegalStateException("This role is already full.");
        User resident = findUser(email);
        return signupRepo.save(EventVolunteerSignup.builder().slot(slot).resident(resident).build());
    }

    public void withdrawVolunteer(Long slotId, String email) {
        EventVolunteerSignup signup = signupRepo.findBySlotIdAndResidentEmail(slotId, email)
            .orElseThrow(() -> new ResourceNotFoundException("Signup not found"));
        signupRepo.delete(signup);
    }

    // ── Recognition ────────────────────────────────────────────────────────
    public Event saveRecognition(Long eventId, String recognitionJson, String email) {
        Event event = findEvent(eventId);
        assertOrganiser(event, email);
        event.setRecognitionJson(recognitionJson);
        return eventRepo.save(event);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2 — CONTRIBUTION COLLECTION
    // ═══════════════════════════════════════════════════════════════════════

    public Map<String, Object> createContributionOrder(Long eventId, BigDecimal amount, String email) {
        Event event = findEvent(eventId);
        if (event.getStatus() != EventStatus.APPROVED && event.getStatus() != EventStatus.ACTIVE)
            throw new IllegalStateException("Contributions only accepted for approved/active events.");

        var cfg = maintenanceCfgRepo.findById(1L)
            .orElseThrow(() -> new IllegalStateException("Razorpay not configured. Ask admin to set up in Maintenance → Config."));
        if (cfg.getRazorpayKeyId() == null || cfg.getRazorpayKeyId().isBlank())
            throw new IllegalStateException("Razorpay not configured.");

        try {
            RazorpayClient client = new RazorpayClient(cfg.getRazorpayKeyId(), cfg.getRazorpayKeySecret());
            int amountPaise = amount.multiply(new BigDecimal("100")).intValue();
            JSONObject opts = new JSONObject();
            opts.put("amount", amountPaise);
            opts.put("currency", "INR");
            opts.put("receipt", "EVT-" + eventId + "-" + System.currentTimeMillis());

            com.razorpay.Order order = client.orders.create(opts);
            User resident = findUser(email);

            EventContribution contrib = EventContribution.builder()
                .event(event).resident(resident).amount(amount)
                .type(ContributionType.ONLINE)
                .razorpayOrderId(order.get("id"))
                .confirmed(false)
                .build();
            contribRepo.save(contrib);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("orderId",    order.get("id"));
            resp.put("amount",     amountPaise);
            resp.put("currency",   "INR");
            resp.put("keyId",      cfg.getRazorpayKeyId());
            resp.put("eventName",  event.getName());
            return resp;
        } catch (RazorpayException e) {
            throw new RuntimeException("Payment initiation failed.");
        }
    }

    public void handleContributionWebhook(String payload, String signature) {
        var cfg = maintenanceCfgRepo.findById(1L).orElse(null);
        if (cfg == null) return;
        // Verify signature (reuse same logic as maintenance)
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(cfg.getRazorpayKeySecret().getBytes(), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            if (!sb.toString().equals(signature)) { log.warn("Event webhook signature mismatch"); return; }
        } catch (Exception e) { return; }

        JSONObject event = new JSONObject(payload);
        if (!"payment.captured".equals(event.getString("event"))) return;
        JSONObject payment = event.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
        String orderId = payment.getString("order_id");

        contribRepo.findByRazorpayOrderId(orderId).ifPresent(c -> {
            if (c.getConfirmed()) return;
            c.setConfirmed(true);
            c.setRazorpayPaymentId(payment.getString("id"));
            contribRepo.save(c);
        });
    }

    public EventInKindContribution logInKind(Long eventId, Map<String, Object> req, String email) {
        Event event = findEvent(eventId);
        if (event.getStatus() != EventStatus.APPROVED && event.getStatus() != EventStatus.ACTIVE)
            throw new IllegalStateException("In-kind contributions only for approved/active events.");
        User resident = findUser(email);
        return inKindRepo.save(EventInKindContribution.builder()
            .event(event).resident(resident)
            .itemName(str(req, "itemName"))
            .description(str(req, "description"))
            .quantity(Integer.parseInt(str(req, "quantity")))
            .estimatedValue(req.containsKey("estimatedValue")
                ? new BigDecimal(str(req, "estimatedValue")) : null)
            .build());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3 — LIVE EXPENSE TRACKING
    // ═══════════════════════════════════════════════════════════════════════

    public EventExpense logExpense(Long eventId, String description, BigDecimal amount,
                                   String category, MultipartFile receipt, String email) throws Exception {
        Event event = findEvent(eventId);
        if (event.getStatus() != EventStatus.ACTIVE && event.getStatus() != EventStatus.COMPLETED)
            throw new IllegalStateException("Expenses can only be logged for active or completed events.");

        // Check volunteer is signed up for this event
        boolean isOrganiser = event.getCreatedBy().getEmail().equals(email);
        boolean isVolunteer  = !signupRepo.findByEventId(eventId).stream()
            .filter(s -> s.getResident().getEmail().equals(email)).findAny().isEmpty();
        if (!isOrganiser && !isVolunteer)
            throw new SecurityException("Only event volunteers and organisers can log expenses.");

        String receiptPath = null;
        if (receipt != null && !receipt.isEmpty()) {
            Path dir = Paths.get(eventsDir, "receipts");
            Files.createDirectories(dir);
            String fname = "exp-" + eventId + "-" + System.currentTimeMillis() + "-" + receipt.getOriginalFilename();
            Files.copy(receipt.getInputStream(), dir.resolve(fname), StandardCopyOption.REPLACE_EXISTING);
            receiptPath = "receipts/" + fname;
        }

        User user = findUser(email);
        return expenseRepo.save(EventExpense.builder()
            .event(event).loggedBy(user)
            .description(description).amount(amount)
            .category(category).receiptPath(receiptPath)
            .build());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4 — POST-EVENT SETTLEMENT
    // ═══════════════════════════════════════════════════════════════════════

    public Map<String, Object> getBalanceSheet(Long eventId) {
        Event event = findEvent(eventId);
        BigDecimal totalContributions = contribRepo.sumConfirmedByEventId(eventId);
        BigDecimal totalExpenses      = expenseRepo.sumByEventId(eventId);
        BigDecimal surplus            = totalContributions.subtract(totalExpenses);

        List<EventContribution>       contribs   = contribRepo.findByEventIdOrderByCreatedAtDesc(eventId);
        List<EventInKindContribution> inKind     = inKindRepo.findByEventIdOrderByCreatedAtDesc(eventId);
        List<EventExpense>            expenses   = expenseRepo.findByEventIdOrderByCreatedAtDesc(eventId);

        // Expense by category
        Map<String, BigDecimal> byCategory = expenses.stream()
            .collect(Collectors.groupingBy(
                e -> e.getCategory() != null ? e.getCategory() : "Other",
                Collectors.reducing(BigDecimal.ZERO, EventExpense::getAmount, BigDecimal::add)));

        Map<String, Object> sheet = new LinkedHashMap<>();
        sheet.put("eventName",          event.getName());
        sheet.put("estimatedBudget",    event.getEstimatedBudget());
        sheet.put("totalContributions", totalContributions);
        sheet.put("totalExpenses",      totalExpenses);
        sheet.put("surplus",            surplus);
        sheet.put("hasSurplus",         surplus.compareTo(BigDecimal.ZERO) > 0);
        sheet.put("contributions",      contribs);
        sheet.put("inKindContributions",inKind);
        sheet.put("expenses",           expenses);
        sheet.put("expenseByCategory",  byCategory);
        return sheet;
    }

    public EventSurplusVote castSurplusVote(Long eventId, String choice, String voterEmail) {
        Event event = findEvent(eventId);
        if (event.getStatus() != EventStatus.COMPLETED)
            throw new IllegalStateException("Surplus voting only available for completed events.");
        if (surplusVoteRepo.findByEventIdAndVoterEmail(eventId, voterEmail).isPresent())
            throw new IllegalStateException("You have already voted on surplus.");
        User voter = findUser(voterEmail);
        return surplusVoteRepo.save(EventSurplusVote.builder()
            .event(event).voter(voter)
            .choice(SurplusChoice.valueOf(choice.toUpperCase()))
            .build());
    }

    public Map<String, Object> getSurplusVoteResults(Long eventId) {
        long carryForward = surplusVoteRepo.countByEventIdAndChoice(eventId, SurplusChoice.CARRY_FORWARD);
        long donate       = surplusVoteRepo.countByEventIdAndChoice(eventId, SurplusChoice.DONATE);
        long refund       = surplusVoteRepo.countByEventIdAndChoice(eventId, SurplusChoice.REFUND);
        long total        = surplusVoteRepo.countByEventId(eventId);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("CARRY_FORWARD", carryForward);
        m.put("DONATE",        donate);
        m.put("REFUND",        refund);
        m.put("total",         total);
        return m;
    }

    // ── Photos ────────────────────────────────────────────────────────────
    public EventPhoto uploadPhoto(Long eventId, MultipartFile file, String caption, String email) throws Exception {
        Event event = findEvent(eventId);
        boolean isOrganiser = event.getCreatedBy().getEmail().equals(email);
        boolean isVolunteer = !signupRepo.findByEventId(eventId).stream()
            .filter(s -> s.getResident().getEmail().equals(email)).findAny().isEmpty();
        if (!isOrganiser && !isVolunteer)
            throw new SecurityException("Only volunteers and organisers can upload photos.");

        Path dir = Paths.get(eventsDir, "photos");
        Files.createDirectories(dir);
        String fname = "photo-" + eventId + "-" + System.currentTimeMillis() + "-" + file.getOriginalFilename();
        Files.copy(file.getInputStream(), dir.resolve(fname), StandardCopyOption.REPLACE_EXISTING);

        User uploader = findUser(email);
        return photoRepo.save(EventPhoto.builder()
            .event(event).uploadedBy(uploader)
            .photoPath("photos/" + fname)
            .caption(caption)
            .build());
    }

    public List<EventPhoto> getPhotos(Long eventId) {
        return photoRepo.findByEventIdOrderByUploadedAtDesc(eventId);
    }

    // ── Queries ───────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Event> getAllEvents() {
        return eventRepo.findAllByOrderByEventDateDesc();
    }

    @Transactional(readOnly = true)
    public List<Event> getActiveEvents() {
        return eventRepo.findByStatusInOrderByEventDateAsc(List.of(
            EventStatus.VOTING, EventStatus.APPROVED, EventStatus.ACTIVE));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getEventDetail(Long eventId, String viewerEmail) {
        Event event = findEvent(eventId);
        long yesVotes   = voteRepo.countByEventIdAndChoice(eventId, EventVoteChoice.YES);
        long noVotes    = voteRepo.countByEventIdAndChoice(eventId, EventVoteChoice.NO);
        long totalVotes = voteRepo.countByEventId(eventId);
        boolean hasVoted = voteRepo.findByEventIdAndVoterEmail(eventId, viewerEmail).isPresent();
        Optional<EventVote> myVote = voteRepo.findByEventIdAndVoterEmail(eventId, viewerEmail);

        BigDecimal raised   = contribRepo.sumConfirmedByEventId(eventId);
        BigDecimal spent    = expenseRepo.sumByEventId(eventId);

        List<EventVolunteerSlot> slots = slotRepo.findByEventId(eventId);
        List<Map<String, Object>> slotData = slots.stream().map(slot -> {
            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("slot",       slot);
            sm.put("signupCount", signupRepo.countBySlotId(slot.getId()));
            sm.put("isFull",     signupRepo.countBySlotId(slot.getId()) >= slot.getMaxVolunteers());
            boolean isSignedUp = signupRepo.findBySlotIdAndResidentEmail(slot.getId(), viewerEmail).isPresent();
            sm.put("isSignedUp", isSignedUp);
            return sm;
        }).collect(Collectors.toList());

        boolean hasSurplusVoted = surplusVoteRepo.findByEventIdAndVoterEmail(eventId, viewerEmail).isPresent();

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("event",          event);
        m.put("yesVotes",       yesVotes);
        m.put("noVotes",        noVotes);
        m.put("totalVotes",     totalVotes);
        m.put("hasVoted",       hasVoted);
        m.put("myVote",         myVote.map(v -> v.getChoice().name()).orElse(null));
        m.put("raised",         raised);
        m.put("spent",          spent);
        m.put("volunteerSlots", slotData);
        m.put("expenses",       expenseRepo.findByEventIdOrderByCreatedAtDesc(eventId));
        m.put("contributions",  contribRepo.findByEventIdOrderByCreatedAtDesc(eventId));
        m.put("hasSurplusVoted", hasSurplusVoted);
        m.put("surplusResults", getSurplusVoteResults(eventId));
        return m;
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private Event findEvent(Long id) {
        return eventRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
    }
    private User findUser(String email) {
        return userRepo.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
    private void assertOrganiser(Event event, String email) {
        if (!event.getCreatedBy().getEmail().equals(email))
            throw new SecurityException("Only the event organiser can perform this action.");
    }
    private String str(Map<String, Object> m, String key) {
        return m.getOrDefault(key, "").toString();
    }
}
