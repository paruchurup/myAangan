package com.myaangan.service;

import com.myaangan.dto.DeliveryRequest;
import com.myaangan.dto.DeliveryResponse;
import com.myaangan.dto.DeliveryStatusUpdateRequest;
import com.myaangan.dto.OtpGenerateResponse;
import com.myaangan.dto.OtpVerifyRequest;
import com.myaangan.entity.Delivery;
import com.myaangan.entity.User;
import com.myaangan.enums.DeliveryStatus;
import com.myaangan.enums.Role;
import com.myaangan.enums.UserStatus;
import com.myaangan.repository.DeliveryRepository;
import com.myaangan.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final List<DeliveryStatus> PENDING_STATUSES =
        List.of(DeliveryStatus.ARRIVED, DeliveryStatus.NOTIFIED);

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    // ── Guard: Log new delivery ───────────────────────────────────────────────

    public DeliveryResponse logDelivery(DeliveryRequest req, String guardEmail) {
        User guard = userRepository.findByEmail(guardEmail)
                .orElseThrow(() -> new RuntimeException("Guard not found"));

        // Try to auto-resolve resident from flat number
        User resident = findResident(req.getFlatNumber(), req.getBlock());
        if (resident == null) {
            log.warn("No resident found for flat={} block={}", req.getFlatNumber(), req.getBlock());
        }

        Delivery delivery = Delivery.builder()
                .flatNumber(req.getFlatNumber().trim().toUpperCase())
                .block(req.getBlock() != null ? req.getBlock().trim().toUpperCase() : null)
                .resident(resident)
                .deliveryType(req.getDeliveryType())
                .senderName(req.getSenderName())
                .description(req.getDescription())
                .status(DeliveryStatus.ARRIVED)
                .loggedBy(guard)
                .build();

        return DeliveryResponse.from(deliveryRepository.save(delivery));
    }

    // ── Resident: View my pending deliveries ─────────────────────────────────

    @Transactional(readOnly = true)
    public List<DeliveryResponse> getMyPendingDeliveries(String residentEmail) {
        return deliveryRepository
                .findByResidentEmailAndStatusInOrderByCreatedAtDesc(
                    residentEmail, PENDING_STATUSES)
                .stream().map(d -> {
                    // Auto-mark as NOTIFIED when resident views
                    if (d.getStatus() == DeliveryStatus.ARRIVED) {
                        d.setStatus(DeliveryStatus.NOTIFIED);
                        d.setNotifiedAt(LocalDateTime.now());
                        deliveryRepository.save(d);
                    }
                    return DeliveryResponse.from(d);
                })
                .collect(Collectors.toList());
    }

    // ── Resident: View full history ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DeliveryResponse> getMyDeliveryHistory(String residentEmail) {
        return deliveryRepository
                .findByResidentEmailOrderByCreatedAtDesc(residentEmail)
                .stream().map(DeliveryResponse::from).collect(Collectors.toList());
    }

    // ── Resident: Pending count for badge ─────────────────────────────────────

    @Transactional(readOnly = true)
    public long getPendingCount(String residentEmail) {
        return deliveryRepository.countByResidentEmailAndStatusIn(
            residentEmail, PENDING_STATUSES);
    }

    // ── Guard: Today's deliveries ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DeliveryResponse> getTodaysDeliveries() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIDNIGHT);
        return deliveryRepository.findByCreatedAtAfterOrderByCreatedAtDesc(startOfDay)
                .stream().map(DeliveryResponse::from).collect(Collectors.toList());
    }

    // ── Guard: My logged deliveries ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DeliveryResponse> getMyLoggedDeliveries(String guardEmail) {
        return deliveryRepository.findByLoggedByEmailOrderByCreatedAtDesc(guardEmail)
                .stream().map(DeliveryResponse::from).collect(Collectors.toList());
    }

    // ── Admin: All deliveries ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DeliveryResponse> getAllDeliveries(DeliveryStatus status) {
        List<Delivery> deliveries = status != null
            ? deliveryRepository.findByStatusOrderByCreatedAtDesc(status)
            : deliveryRepository.findAllByOrderByCreatedAtDesc();
        return deliveries.stream().map(DeliveryResponse::from).collect(Collectors.toList());
    }

    // ── Get single delivery ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DeliveryResponse getById(Long id) {
        return DeliveryResponse.from(deliveryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery not found")));
    }

    // ── Update status (Collected / Returned) ──────────────────────────────────

    public DeliveryResponse updateStatus(Long id, DeliveryStatusUpdateRequest req,
                                          String userEmail) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));

        // Only allow valid transitions
        if (delivery.getStatus() == DeliveryStatus.COLLECTED ||
            delivery.getStatus() == DeliveryStatus.RETURNED) {
            throw new RuntimeException("Delivery is already " + delivery.getStatus());
        }

        delivery.setStatus(req.getStatus());

        if (req.getStatus() == DeliveryStatus.COLLECTED) {
            delivery.setCollectedAt(LocalDateTime.now());
            delivery.setCollectedBy(req.getCollectedBy() != null
                ? req.getCollectedBy() : "Resident");
        }

        if (req.getResidentNote() != null && !req.getResidentNote().isBlank()) {
            delivery.setResidentNote(req.getResidentNote());
        }

        return DeliveryResponse.from(deliveryRepository.save(delivery));
    }

    // ── OTP: Generate ─────────────────────────────────────────────────────────
    // initiatedBy = "GUARD" or "RESIDENT"
    public OtpGenerateResponse generateOtp(Long deliveryId, String initiatedBy) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));

        if (delivery.getStatus() == DeliveryStatus.COLLECTED ||
            delivery.getStatus() == DeliveryStatus.RETURNED) {
            throw new RuntimeException("Delivery is already " + delivery.getStatus());
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

        delivery.setOtpHash(passwordEncoder.encode(otp));
        delivery.setOtpInitiatedBy(initiatedBy);
        delivery.setOtpExpiresAt(expiresAt);
        delivery.setOtpVerified(false);
        deliveryRepository.save(delivery);

        log.info("OTP generated for delivery={} by={}", deliveryId, initiatedBy);
        return new OtpGenerateResponse(otp, initiatedBy, expiresAt.toString(), deliveryId);
    }

    // ── OTP: Verify ───────────────────────────────────────────────────────────
    public DeliveryResponse verifyOtp(Long deliveryId, OtpVerifyRequest req, String collectedBy) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));

        if (delivery.getOtpHash() == null) {
            throw new RuntimeException("No OTP has been generated for this delivery");
        }
        if (delivery.isOtpVerified()) {
            throw new RuntimeException("OTP has already been used");
        }
        if (delivery.getOtpExpiresAt() == null ||
            delivery.getOtpExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired — please generate a new one");
        }
        if (!passwordEncoder.matches(req.getOtp(), delivery.getOtpHash())) {
            throw new RuntimeException("Invalid OTP");
        }

        // OTP verified — mark as collected
        delivery.setOtpVerified(true);
        delivery.setStatus(DeliveryStatus.COLLECTED);
        delivery.setCollectedAt(LocalDateTime.now());
        delivery.setCollectedBy(collectedBy != null ? collectedBy : "Verified via OTP");
        delivery.setNotifiedAt(delivery.getNotifiedAt() != null
            ? delivery.getNotifiedAt() : LocalDateTime.now());

        log.info("OTP verified for delivery={} — marked COLLECTED", deliveryId);
        return DeliveryResponse.from(deliveryRepository.save(delivery));
    }

    // ── Flat number search (guard uses while logging) ─────────────────────────

    @Transactional(readOnly = true)
    public List<String> searchFlats(String query) {
        return userRepository.findByRoleAndStatus(Role.RESIDENT, UserStatus.ACTIVE)
                .stream()
                .filter(u -> u.getFlatNumber() != null && !u.getFlatNumber().isBlank())
                .filter(u -> {
                    String block = (u.getBlock() != null && !u.getBlock().isBlank())
                        ? u.getBlock().trim() : null;
                    String flat = (block != null ? block + "-" : "") + u.getFlatNumber().trim();
                    return flat.toLowerCase().contains(query.toLowerCase());
                })
                .map(u -> {
                    String block = (u.getBlock() != null && !u.getBlock().isBlank())
                        ? u.getBlock().trim() : null;
                    // Format: "A-1108 (Praveena Paruchuru)" or "1108 (Praveena Paruchuru)"
                    // Store block and flat separately with ||| separator for reliable parsing
                    String flatDisplay = (block != null ? block + "-" : "") + u.getFlatNumber().trim();
                    String blockPart   = block != null ? block : "";
                    String flatPart    = u.getFlatNumber().trim();
                    return flatDisplay + " (" + u.getFirstName() + " " + u.getLastName() + ")"
                        + "|||" + blockPart + "|||" + flatPart;
                })
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
    }

    // ── Helper: resolve resident from flat ───────────────────────────────────

    private User findResident(String flatNumber, String block) {
        String cleanFlat  = flatNumber.trim().toUpperCase();
        // Treat empty string same as null — some DB rows have block=""
        String cleanBlock = (block != null && !block.trim().isBlank())
            ? block.trim().toUpperCase() : null;

        if (cleanBlock != null) {
            return userRepository.findByFlatNumberAndBlockAndRoleAndStatus(
                cleanFlat, cleanBlock, Role.RESIDENT, UserStatus.ACTIVE)
                .or(() -> userRepository.findByFlatNumberAndRoleAndStatus(
                    cleanFlat, Role.RESIDENT, UserStatus.ACTIVE))
                .orElse(null);
        }
        return userRepository.findByFlatNumberAndRoleAndStatus(
            cleanFlat, Role.RESIDENT, UserStatus.ACTIVE).orElse(null);
    }
}
