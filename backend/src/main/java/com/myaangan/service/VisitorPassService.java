package com.myaangan.service;

import com.myaangan.dto.VisitorPassRequest;
import com.myaangan.entity.*;
import com.myaangan.enums.*;
import com.myaangan.exception.ResourceNotFoundException;
import com.myaangan.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class VisitorPassService {

    private final VisitorPassRepository    passRepo;
    private final NotificationService notifSvc;
    private final VisitorPassLogRepository logRepo;
    private final UserRepository           userRepo;

    private static final String TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
    private static final SecureRandom RNG   = new SecureRandom();

    // ═════════════════════════════════════════════════════════════════════
    // RESIDENT: CREATE / MANAGE PASSES
    // ═════════════════════════════════════════════════════════════════════

    public VisitorPass createPass(VisitorPassRequest req, String email) {
        validateRequest(req);
        User creator = findUser(email);

        String token = generateToken();

        String allowedDays = null;
        if (req.getPassType() == PassType.STANDING && req.getAllowedDays() != null) {
            allowedDays = req.getAllowedDays().stream()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
        }

        VisitorPass pass = VisitorPass.builder()
            .token(token)
            .createdBy(creator)
            .visitorName(req.getVisitorName().trim())
            .visitorPhone(req.getVisitorPhone())
            .purpose(req.getPurpose())
            .passType(req.getPassType())
            .status(PassStatus.ACTIVE)
            .validDate(req.getValidDate())
            .windowStart(req.getWindowStart())
            .windowEnd(req.getWindowEnd())
            .allowedDays(allowedDays)
            .standingFrom(req.getStandingFrom() != null ? req.getStandingFrom() : LocalDate.now())
            .standingUntil(req.getStandingUntil())
            .notes(req.getNotes())
            .build();

        pass = passRepo.save(pass);
        notifSvc.visitorArrived(pass.getCreatedBy().getEmail(), pass.getVisitorName(), pass.getId());
        log.info("Pass {} created by {} for visitor '{}'", token, email, req.getVisitorName());
        return pass;
    }

    public VisitorPass cancelPass(Long id, String email) {
        VisitorPass pass = findPass(id);
        if (!pass.getCreatedBy().getEmail().equals(email))
            throw new SecurityException("Not authorised to cancel this pass");
        if (pass.getStatus() == PassStatus.USED || pass.getStatus() == PassStatus.EXPIRED)
            throw new IllegalStateException("Cannot cancel a " + pass.getStatus() + " pass");
        pass.setStatus(PassStatus.CANCELLED);
        notifSvc.visitorArrived(pass.getCreatedBy().getEmail(), pass.getVisitorName(), pass.getId());
        log.info("Pass {} cancelled by {}", pass.getToken(), email);
        return passRepo.save(pass);
    }

    @Transactional(readOnly = true)
    public List<VisitorPass> getMyPasses(String email) {
        return passRepo.findByCreatedByEmailOrderByCreatedAtDesc(email);
    }

    @Transactional(readOnly = true)
    public VisitorPass getPassById(Long id, String email) {
        VisitorPass pass = findPass(id);
        if (!pass.getCreatedBy().getEmail().equals(email))
            throw new SecurityException("Not authorised to view this pass");
        return pass;
    }

    @Transactional(readOnly = true)
    public List<VisitorPass> getAllPasses() {
        return passRepo.findAllOrderByCreatedAtDesc();
    }

    // ═════════════════════════════════════════════════════════════════════
    // GUARD: VERIFY + CHECK-IN
    // ═════════════════════════════════════════════════════════════════════

    /**
     * Validate a pass token (called on scan/code entry).
     * Returns a result object with: valid flag, pass details, and error reason if invalid.
     * Guard sees the error and decides whether to override.
     */
    @Transactional(readOnly = true)
    public PassValidationResult validateToken(String token) {
        Optional<VisitorPass> opt = passRepo.findByToken(token.toUpperCase());
        if (opt.isEmpty())
            return PassValidationResult.invalid(null, "Pass not found. Token: " + token.toUpperCase());

        VisitorPass pass = opt.get();
        LocalDate  today = LocalDate.now();
        LocalTime  now   = LocalTime.now();

        // Cancelled
        if (pass.getStatus() == PassStatus.CANCELLED)
            return PassValidationResult.invalid(pass, "This pass has been cancelled by the resident.");

        // Already used (ONE_TIME)
        if (pass.getStatus() == PassStatus.USED)
            return PassValidationResult.invalid(pass, "This one-time pass has already been used.");

        // Expired
        if (pass.getStatus() == PassStatus.EXPIRED)
            return PassValidationResult.invalid(pass, "This pass has expired.");

        if (pass.getPassType() == PassType.ONE_TIME) {
            if (!today.equals(pass.getValidDate()))
                return PassValidationResult.invalid(pass,
                    "This pass is valid on " + pass.getValidDate() + " only. Today is " + today + ".");
            if (pass.getWindowStart() != null && now.isBefore(pass.getWindowStart()))
                return PassValidationResult.invalid(pass,
                    "Entry window starts at " + pass.getWindowStart() + ". Current time: " + now + ".");
            if (pass.getWindowEnd() != null && now.isAfter(pass.getWindowEnd()))
                return PassValidationResult.invalid(pass,
                    "Entry window closed at " + pass.getWindowEnd() + ". Current time: " + now + ".");
        }

        if (pass.getPassType() == PassType.STANDING) {
            if (pass.getStandingUntil() != null && today.isAfter(pass.getStandingUntil()))
                return PassValidationResult.invalid(pass, "Standing pass expired on " + pass.getStandingUntil() + ".");
            if (pass.getStandingFrom() != null && today.isBefore(pass.getStandingFrom()))
                return PassValidationResult.invalid(pass, "Standing pass starts on " + pass.getStandingFrom() + ".");
            if (pass.getAllowedDays() != null && !pass.getAllowedDays().isEmpty()) {
                int todayNum = today.getDayOfWeek().getValue(); // 1=Mon … 7=Sun
                Set<String> allowed = new HashSet<>(Arrays.asList(pass.getAllowedDays().split(",")));
                if (!allowed.contains(String.valueOf(todayNum)))
                    return PassValidationResult.invalid(pass,
                        "This pass is not valid on " + today.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, Locale.ENGLISH) + ".");
            }
            if (pass.getWindowStart() != null && now.isBefore(pass.getWindowStart()))
                return PassValidationResult.invalid(pass,
                    "Entry window starts at " + pass.getWindowStart() + ".");
            if (pass.getWindowEnd() != null && now.isAfter(pass.getWindowEnd()))
                return PassValidationResult.invalid(pass,
                    "Entry window closed at " + pass.getWindowEnd() + ".");
        }

        return PassValidationResult.valid(pass);
    }

    /**
     * Check in a visitor against a pass.
     *
     * If override=true, guard is manually allowing entry despite validation failure.
     * overrideReason is required in that case.
     */
    public VisitorPassLog checkIn(String token, String guardEmail,
                                  boolean override, String overrideReason) {
        PassValidationResult result = validateToken(token);

        if (!result.isValid() && !override)
            throw new IllegalStateException(result.getErrorReason());

        if (override && (overrideReason == null || overrideReason.isBlank()))
            throw new IllegalArgumentException("Override reason is required when overriding a pass.");

        VisitorPass pass = result.getPass() != null
            ? result.getPass()
            : passRepo.findByToken(token.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Pass not found"));

        User guard = findUser(guardEmail);

        // Mark ONE_TIME as USED
        if (pass.getPassType() == PassType.ONE_TIME && pass.getStatus() == PassStatus.ACTIVE && !override) {
            pass.setStatus(PassStatus.USED);
            passRepo.save(pass);
        }

        VisitorPassLog entry = VisitorPassLog.builder()
            .pass(pass)
            .checkedInBy(guard)
            .checkInStatus(override ? PassCheckInStatus.OVERRIDE : PassCheckInStatus.CHECKED_IN)
            .overrideReason(override ? overrideReason : null)
            .build();

        entry = logRepo.save(entry);
        notifSvc.visitorArrived(pass.getCreatedBy().getEmail(), pass.getVisitorName(), pass.getId());
        log.info("Pass {} checked in by guard {} [{}]", token, guardEmail,
            override ? "OVERRIDE: " + overrideReason : "VALID");
        return entry;
    }

    @Transactional(readOnly = true)
    public List<VisitorPassLog> getPassLogs(Long passId) {
        return logRepo.findByPassIdOrderByCheckedInAtDesc(passId);
    }

    // ═════════════════════════════════════════════════════════════════════
    // SCHEDULER: auto-expire passes
    // ═════════════════════════════════════════════════════════════════════

    @Scheduled(cron = "0 1 0 * * *") // 00:01 daily
    public void expirePasses() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        passRepo.findAllOrderByCreatedAtDesc().stream()
            .filter(p -> p.getStatus() == PassStatus.ACTIVE)
            .forEach(p -> {
                boolean shouldExpire = false;
                if (p.getPassType() == PassType.ONE_TIME
                        && p.getValidDate() != null
                        && p.getValidDate().isBefore(LocalDate.now()))
                    shouldExpire = true;
                if (p.getPassType() == PassType.STANDING
                        && p.getStandingUntil() != null
                        && p.getStandingUntil().isBefore(LocalDate.now()))
                    shouldExpire = true;
                if (shouldExpire) {
                    p.setStatus(PassStatus.EXPIRED);
                    passRepo.save(p);
                    log.debug("Auto-expired pass {}", p.getToken());
                }
            });
    }

    // ═════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═════════════════════════════════════════════════════════════════════

    private String generateToken() {
        String token;
        do {
            char[] chars = new char[8];
            for (int i = 0; i < 8; i++)
                chars[i] = TOKEN_CHARS.charAt(RNG.nextInt(TOKEN_CHARS.length()));
            token = new String(chars);
        } while (passRepo.existsByToken(token));
        return token;
    }

    private void validateRequest(VisitorPassRequest req) {
        if (req.getVisitorName() == null || req.getVisitorName().isBlank())
            throw new IllegalArgumentException("Visitor name is required.");
        if (req.getPassType() == null)
            throw new IllegalArgumentException("Pass type is required.");
        if (req.getPassType() == PassType.ONE_TIME && req.getValidDate() == null)
            throw new IllegalArgumentException("Valid date is required for one-time passes.");
        if (req.getPassType() == PassType.STANDING
                && (req.getAllowedDays() == null || req.getAllowedDays().isEmpty()))
            throw new IllegalArgumentException("At least one allowed day is required for standing passes.");
    }

    private VisitorPass findPass(Long id) {
        return passRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Pass not found"));
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // ── Inner result class ────────────────────────────────────────────────
    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class PassValidationResult {
        private final boolean     valid;
        private final VisitorPass pass;
        private final String      errorReason;

        public static PassValidationResult valid(VisitorPass p)               { return new PassValidationResult(true,  p, null); }
        public static PassValidationResult invalid(VisitorPass p, String msg) { return new PassValidationResult(false, p, msg);  }
    }
}
