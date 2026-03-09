package com.myaangan.service;

import com.myaangan.entity.*;
import com.myaangan.enums.BillStatus;
import com.myaangan.exception.ResourceNotFoundException;
import com.myaangan.repository.*;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MaintenanceService {

    private final MaintenanceConfigRepository configRepo;
    private final MaintenanceBillRepository   billRepo;
    private final NotificationService notifSvc;
    private final UserRepository              userRepo;
    private final MaintenanceReceiptService   receiptService;

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════════════════════════════════════════

    public MaintenanceConfig getConfig() {
        return configRepo.findById(1L).orElseGet(() -> {
            // Default config on first boot
            MaintenanceConfig cfg = MaintenanceConfig.builder()
                .id(1L)
                .monthlyAmount(new BigDecimal("2000.00"))
                .dueDayOfMonth(15)
                .latePenaltyFlat(new BigDecimal("500.00"))
                .lateInterestPct(new BigDecimal("2.00"))
                .societyName("MyAangan Society")
                .razorpayKeyId("")
                .razorpayKeySecret("")
                .build();
            return configRepo.save(cfg);
        });
    }

    public MaintenanceConfig updateConfig(MaintenanceConfig req, String adminEmail) {
        MaintenanceConfig cfg = getConfig();
        if (req.getMonthlyAmount()    != null) cfg.setMonthlyAmount(req.getMonthlyAmount());
        if (req.getDueDayOfMonth()    != null) cfg.setDueDayOfMonth(req.getDueDayOfMonth());
        if (req.getLatePenaltyFlat()  != null) cfg.setLatePenaltyFlat(req.getLatePenaltyFlat());
        if (req.getLateInterestPct()  != null) cfg.setLateInterestPct(req.getLateInterestPct());
        if (req.getSocietyName()      != null) cfg.setSocietyName(req.getSocietyName());
        if (req.getRazorpayKeyId()    != null) cfg.setRazorpayKeyId(req.getRazorpayKeyId());
        if (req.getRazorpayKeySecret()!= null) cfg.setRazorpayKeySecret(req.getRazorpayKeySecret());
        log.info("Maintenance config updated by {}", adminEmail);
        return configRepo.save(cfg);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BILL GENERATION — called by scheduler on 1st of month & manually
    // ═══════════════════════════════════════════════════════════════════════

    public int generateBillsForMonth(int year, int month) {
        MaintenanceConfig cfg = getConfig();
        LocalDate dueDate = LocalDate.of(year, month, Math.min(cfg.getDueDayOfMonth(), YearMonth.of(year, month).lengthOfMonth()));

        // Get all active residents
        List<User> residents = userRepo.findAll().stream()
            .filter(u -> u.getStatus() != null && u.getStatus().name().equals("ACTIVE"))
            .filter(u -> u.getFlatNumber() != null && !u.getFlatNumber().isBlank())
            .collect(Collectors.toList());

        // Deduplicate by flatKey (one bill per flat, first resident found)
        Map<String, User> flatMap = new LinkedHashMap<>();
        for (User u : residents) {
            String key = buildFlatKey(u.getBlock(), u.getFlatNumber());
            flatMap.putIfAbsent(key, u);
        }

        int created = 0;
        for (Map.Entry<String, User> e : flatMap.entrySet()) {
            String flatKey = e.getKey();
            if (billRepo.existsByFlatKeyAndBillYearAndBillMonth(flatKey, year, month)) continue;

            MaintenanceBill bill = MaintenanceBill.builder()
                .flatKey(flatKey)
                .resident(e.getValue())
                .billYear(year)
                .billMonth(month)
                .baseAmount(cfg.getMonthlyAmount())
                .penaltyAmount(BigDecimal.ZERO)
                .interestAmount(BigDecimal.ZERO)
                .totalAmount(cfg.getMonthlyAmount())
                .dueDate(dueDate)
                .status(BillStatus.UNPAID)
                .build();
            billRepo.save(bill);
            created++;
        }
        log.info("Generated {} bills for {}/{}", created, month, year);
        return created;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PENALTY RECALCULATION — runs daily
    // ═══════════════════════════════════════════════════════════════════════

    @Scheduled(cron = "0 5 0 * * *")  // 00:05 daily
    public void recalculatePenalties() {
        MaintenanceConfig cfg = getConfig();
        List<MaintenanceBill> overdue = billRepo.findOverdueBills();
        LocalDate today = LocalDate.now();

        for (MaintenanceBill bill : overdue) {
            // Flat penalty — add once (if not already added)
            if (bill.getPenaltyAmount().compareTo(BigDecimal.ZERO) == 0) {
                bill.setPenaltyAmount(cfg.getLatePenaltyFlat());
            }

            // Monthly interest — months overdue * (baseAmount * rate%)
            long monthsOverdue = YearMonth.from(bill.getDueDate())
                .until(YearMonth.from(today), java.time.temporal.ChronoUnit.MONTHS);
            if (monthsOverdue < 1) monthsOverdue = 1;

            BigDecimal interest = cfg.getMonthlyAmount()
                .multiply(cfg.getLateInterestPct())
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
                .multiply(new BigDecimal(monthsOverdue));
            bill.setInterestAmount(interest);
            bill.setTotalAmount(bill.getBaseAmount().add(bill.getPenaltyAmount()).add(interest));
            billRepo.save(bill);
        }

        // Auto-generate bills on 1st
        LocalDate ld = LocalDate.now();
        if (ld.getDayOfMonth() == 1) {
            generateBillsForMonth(ld.getYear(), ld.getMonthValue());
        }

        log.debug("Penalty recalculation done — {} overdue bills processed", overdue.size());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RAZORPAY — create order
    // ═══════════════════════════════════════════════════════════════════════

    public Map<String, Object> createPaymentOrder(Long billId, String residentEmail) {
        MaintenanceBill bill = findBill(billId);
        validateOwnership(bill, residentEmail);

        if (bill.getStatus() == BillStatus.PAID)
            throw new IllegalStateException("This bill is already paid.");
        if (bill.getStatus() == BillStatus.WAIVED)
            throw new IllegalStateException("This bill has been waived.");

        MaintenanceConfig cfg = getConfig();
        if (cfg.getRazorpayKeyId() == null || cfg.getRazorpayKeyId().isBlank())
            throw new IllegalStateException("Razorpay is not configured. Please contact admin.");

        try {
            RazorpayClient client = new RazorpayClient(cfg.getRazorpayKeyId(), cfg.getRazorpayKeySecret());

            // Razorpay amount is in paise (multiply by 100)
            int amountPaise = bill.getTotalAmount().multiply(new BigDecimal("100")).intValue();

            JSONObject opts = new JSONObject();
            opts.put("amount", amountPaise);
            opts.put("currency", "INR");
            opts.put("receipt", "MAINT-" + bill.getId());
            opts.put("notes", new JSONObject()
                .put("flat", bill.getFlatKey())
                .put("month", monthName(bill.getBillMonth()) + " " + bill.getBillYear())
                .put("bill_id", bill.getId()));

            Order order = client.orders.create(opts);
            bill.setRazorpayOrderId(order.get("id"));
            billRepo.save(bill);

            Map<String, Object> resp = new HashMap<>();
            resp.put("orderId",   order.get("id"));
            resp.put("amount",    amountPaise);
            resp.put("currency",  "INR");
            resp.put("keyId",     cfg.getRazorpayKeyId());
            resp.put("billId",    bill.getId());
            resp.put("flatKey",   bill.getFlatKey());
            resp.put("month",     monthName(bill.getBillMonth()) + " " + bill.getBillYear());
            resp.put("societyName", cfg.getSocietyName());
            return resp;

        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            throw new RuntimeException("Payment initiation failed. Please try again.");
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RAZORPAY WEBHOOK — payment confirmed
    // ═══════════════════════════════════════════════════════════════════════

    public void handleWebhook(String payload, String signature) {
        MaintenanceConfig cfg = getConfig();

        // Verify HMAC-SHA256 signature
        if (!verifyWebhookSignature(payload, signature, cfg.getRazorpayKeySecret())) {
            log.warn("Razorpay webhook signature mismatch — ignoring");
            throw new SecurityException("Webhook signature invalid");
        }

        JSONObject event = new JSONObject(payload);
        String eventType = event.getString("event");
        if (!"payment.captured".equals(eventType)) return;

        JSONObject payment = event.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
        String orderId   = payment.getString("order_id");
        String paymentId = payment.getString("id");

        billRepo.findByRazorpayOrderId(orderId).ifPresent(bill -> {
            if (bill.getStatus() == BillStatus.PAID) return; // idempotent
            bill.setStatus(BillStatus.PAID);
                notifSvc.maintenancePaymentConfirmed(bill.getResident().getEmail(), monthName(bill.getBillMonth()) + " " + bill.getBillYear(), bill.getId());
            bill.setRazorpayPaymentId(paymentId);
            bill.setPaidAt(LocalDateTime.now());
            bill.setTotalAmount(new BigDecimal(payment.getInt("amount")).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP));
            billRepo.save(bill);

            // Generate PDF receipt
            try {
                String receiptPath = receiptService.generateReceipt(bill, cfg);
                bill.setReceiptPath(receiptPath);
                billRepo.save(bill);
            } catch (Exception e) {
                log.error("Receipt generation failed for bill {}: {}", bill.getId(), e.getMessage());
            }
            log.info("Payment confirmed for bill {} (flat {})", bill.getId(), bill.getFlatKey());
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RESIDENT VIEWS
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<MaintenanceBill> getMyBills(String email) {
        return billRepo.findByResidentEmailOrderByBillYearDescBillMonthDesc(email);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMyOutstanding(String email) {
        List<MaintenanceBill> unpaid = getMyBills(email).stream()
            .filter(b -> b.getStatus() == BillStatus.UNPAID)
            .collect(Collectors.toList());
        BigDecimal total = unpaid.stream()
            .map(MaintenanceBill::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> m = new HashMap<>();
        m.put("unpaidCount", unpaid.size());
        m.put("totalOutstanding", total);
        m.put("bills", unpaid);
        return m;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN VIEWS
    // ═══════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<MaintenanceBill> getBillsForMonth(int year, int month) {
        return billRepo.findByBillYearAndBillMonthOrderByFlatKey(year, month);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDefaulters() {
        return billRepo.findDefaulters().stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("flatKey",    row[0]);
            m.put("unpaidCount", row[1]);
            return m;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMonthlySummary() {
        return billRepo.getMonthlySummary().stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("year",       row[0]);
            m.put("month",      row[1]);
            m.put("monthName",  monthName((Integer) row[1]) + " " + row[0]);
            m.put("totalBills", row[2]);
            m.put("collected",  row[3]);
            m.put("pending",    row[4]);
            return m;
        }).collect(Collectors.toList());
    }

    public MaintenanceBill waiveBill(Long id, String note, String adminEmail) {
        MaintenanceBill bill = findBill(id);
        if (bill.getStatus() == BillStatus.PAID)
            throw new IllegalStateException("Cannot waive a paid bill.");
        bill.setStatus(BillStatus.WAIVED);
        bill.setWaiverNote(note);
        bill.setWaivedBy(adminEmail);
        log.info("Bill {} waived by {}", id, adminEmail);
        MaintenanceBill saved = billRepo.save(bill);
        notifSvc.maintenanceBillGenerated(saved.getResident().getEmail(), monthName(saved.getBillMonth()) + " " + saved.getBillYear(), saved.getTotalAmount().doubleValue(), saved.getId());
        return saved;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    private MaintenanceBill findBill(Long id) {
        return billRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));
    }

    private void validateOwnership(MaintenanceBill bill, String email) {
        if (bill.getResident() == null || !bill.getResident().getEmail().equals(email))
            throw new SecurityException("Not authorised to access this bill.");
    }

    private String buildFlatKey(String block, String flatNumber) {
        if (block == null || block.isBlank()) return flatNumber;
        return block.trim().toUpperCase() + "-" + flatNumber.trim();
    }

    private String monthName(Integer month) {
        return Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH);
    }

    private boolean verifyWebhookSignature(String payload, String signature, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString().equals(signature);
        } catch (Exception e) {
            log.error("Signature verification error: {}", e.getMessage());
            return false;
        }
    }
}
