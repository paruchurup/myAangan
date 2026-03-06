package com.myaangan.service;

import com.myaangan.dto.*;
import com.myaangan.entity.*;
import com.myaangan.enums.*;
import com.myaangan.exception.ResourceNotFoundException;
import com.myaangan.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class VehicleService {

    private final VehicleRepository         vehicleRepo;
    private final ParkingSlotRepository     slotRepo;
    private final VisitorVehicleRepository  visitorRepo;
    private final ParkingViolationRepository violationRepo;
    private final UserRepository            userRepo;

    private static final String UPLOAD_DIR = "/app/uploads/vehicles";

    // ── Vehicle Registration ──────────────────────────────────────────────────

    public VehicleResponse registerVehicle(VehicleRequest req, String ownerEmail,
                                           MultipartFile photo) throws IOException {
        if (vehicleRepo.existsByPlateNumberIgnoreCase(req.getPlateNumber()))
            throw new IllegalArgumentException("Plate number already registered: " + req.getPlateNumber());

        User owner = findUser(ownerEmail);
        Vehicle v = Vehicle.builder()
            .owner(owner)
            .plateNumber(req.getPlateNumber().toUpperCase().replaceAll("\\s+", ""))
            .type(req.getType())
            .make(req.getMake())
            .model(req.getModel())
            .colour(req.getColour())
            .year(req.getYear())
            .status(VehicleStatus.PENDING)
            .build();

        if (photo != null && !photo.isEmpty()) {
            v.setPhotoPath(savePhoto(photo, v.getPlateNumber()));
        }

        vehicleRepo.save(v);
        log.info("Vehicle {} registered by {}", v.getPlateNumber(), ownerEmail);
        return toResponse(v);
    }

    public VehicleResponse updateVehicle(Long id, VehicleRequest req, String email,
                                         MultipartFile photo) throws IOException {
        Vehicle v = findVehicle(id);
        assertOwnerOrManager(v, email);
        if (v.getStatus() == VehicleStatus.APPROVED)
            throw new IllegalStateException("Cannot edit an approved vehicle — contact admin");

        v.setMake(req.getMake());
        v.setModel(req.getModel());
        v.setColour(req.getColour());
        v.setYear(req.getYear());

        if (photo != null && !photo.isEmpty()) {
            v.setPhotoPath(savePhoto(photo, v.getPlateNumber()));
        }
        return toResponse(vehicleRepo.save(v));
    }

    public void deleteVehicle(Long id, String email) {
        Vehicle v = findVehicle(id);
        assertOwnerOrManager(v, email);
        if (v.getStatus() == VehicleStatus.APPROVED && v.getAssignedSlot() != null)
            throw new IllegalStateException("Unassign parking slot before deleting");
        ParkingSlot slot = v.getAssignedSlot();
        VehicleType type = v.getType();
        vehicleRepo.delete(v);
        // If a CAR was detached, update slot status
        if (slot != null && type == VehicleType.CAR) {
            refreshSlotStatus(slot);
        }
    }

    // ── Approval / Rejection ─────────────────────────────────────────────────

    public VehicleResponse approveVehicle(Long id, String adminEmail) {
        Vehicle v = findVehicle(id);
        User admin = findUser(adminEmail);
        v.setStatus(VehicleStatus.APPROVED);
        v.setApprovedBy(admin);
        v.setApprovedAt(LocalDateTime.now());
        v.setAdminNote(null);
        log.info("Vehicle {} approved by {}", v.getPlateNumber(), adminEmail);
        return toResponse(vehicleRepo.save(v));
    }

    public VehicleResponse rejectVehicle(Long id, String reason, String adminEmail) {
        Vehicle v = findVehicle(id);
        v.setStatus(VehicleStatus.REJECTED);
        v.setAdminNote(reason);
        return toResponse(vehicleRepo.save(v));
    }

    public VehicleResponse suspendVehicle(Long id, String reason, String adminEmail) {
        Vehicle v = findVehicle(id);
        v.setStatus(VehicleStatus.SUSPENDED);
        v.setAdminNote(reason);
        // Detach from slot; if it was a CAR, update slot status
        if (v.getAssignedSlot() != null) {
            ParkingSlot slot = v.getAssignedSlot();
            v.setAssignedSlot(null);
            vehicleRepo.save(v);
            refreshSlotStatus(slot);
        }
        return toResponse(vehicleRepo.save(v));
    }

    // ── Slot Management ───────────────────────────────────────────────────────

    public ParkingSlotResponse createSlot(ParkingSlotRequest req) {
        ParkingSlot slot = ParkingSlot.builder()
            .block(req.getBlock().toUpperCase())
            .slotNumber(req.getSlotNumber())
            .level(req.getLevel())
            .type(req.getType())
            .status(SlotStatus.AVAILABLE)
            .notes(req.getNotes())
            .build();
        slotRepo.save(slot);

        if (req.getVehicleId() != null) {
            Vehicle v = findVehicle(req.getVehicleId());
            if (v.getStatus() != VehicleStatus.APPROVED)
                throw new IllegalStateException("Only APPROVED vehicles can be assigned a slot");
            assertCarRule(slot.getId(), v);
            v.setAssignedSlot(slot);
            vehicleRepo.save(v);
            if (v.getType() == VehicleType.CAR) slot.setStatus(SlotStatus.OCCUPIED);
            slotRepo.save(slot);
        }
        return toSlotResponse(slotRepo.findById(slot.getId()).orElseThrow());
    }

    public ParkingSlotResponse claimMySlot(ParkingSlotRequest req, String ownerEmail) {
        Vehicle v = vehicleRepo.findById(req.getVehicleId())
            .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
        if (!v.getOwner().getEmail().equalsIgnoreCase(ownerEmail))
            throw new IllegalStateException("Vehicle does not belong to you");
        if (v.getStatus() != VehicleStatus.APPROVED)
            throw new IllegalStateException("Only approved vehicles can claim a slot");
        if (v.getAssignedSlot() != null)
            throw new IllegalStateException("Vehicle already has a parking slot assigned");

        // Find or create the slot
        ParkingSlot slot;
        if (slotRepo.existsByBlockIgnoreCaseAndSlotNumber(req.getBlock(), req.getSlotNumber())) {
            // Slot already exists — join it (bikes/scooters can share)
            slot = slotRepo.findByBlockIgnoreCaseAndSlotNumber(req.getBlock(), req.getSlotNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
            assertCarRule(slot.getId(), v);
        } else {
            // Create new slot
            slot = ParkingSlot.builder()
                .block(req.getBlock().toUpperCase())
                .slotNumber(req.getSlotNumber())
                .level(req.getLevel())
                .type(req.getType())
                .status(SlotStatus.AVAILABLE)
                .notes(req.getNotes())
                .build();
            slotRepo.save(slot);
        }

        v.setAssignedSlot(slot);
        vehicleRepo.save(v);
        if (v.getType() == VehicleType.CAR) {
            slot.setStatus(SlotStatus.OCCUPIED);
            slotRepo.save(slot);
        }
        log.info("Resident {} assigned slot {}-{} to vehicle {}", ownerEmail,
            slot.getBlock(), slot.getSlotNumber(), v.getPlateNumber());
        return toSlotResponse(slotRepo.findById(slot.getId()).orElseThrow());
    }

    public ParkingSlotResponse updateSlot(Long id, ParkingSlotRequest req) {
        ParkingSlot slot = findSlot(id);
        slot.setLevel(req.getLevel());
        slot.setType(req.getType());
        slot.setNotes(req.getNotes());
        if (req.getStatus() != null) slot.setStatus(req.getStatus());
        return toSlotResponse(slotRepo.save(slot));
    }

    public void deleteSlot(Long id) {
        if (vehicleRepo.existsByAssignedSlotIdAndType(id, VehicleType.CAR)
                || !vehicleRepo.findByAssignedSlotId(id).isEmpty())
            throw new IllegalStateException("Remove all vehicles from slot before deleting");
        slotRepo.deleteById(id);
    }

    public ParkingSlotResponse assignVehicleToSlot(Long slotId, Long vehicleId) {
        ParkingSlot slot = findSlot(slotId);
        Vehicle vehicle = findVehicle(vehicleId);

        if (vehicle.getStatus() != VehicleStatus.APPROVED)
            throw new IllegalStateException("Only APPROVED vehicles can be assigned slots");
        if (vehicle.getAssignedSlot() != null)
            throw new IllegalStateException("Vehicle already has a slot assigned");
        assertCarRule(slotId, vehicle);

        vehicle.setAssignedSlot(slot);
        vehicleRepo.save(vehicle);
        if (vehicle.getType() == VehicleType.CAR) {
            slot.setStatus(SlotStatus.OCCUPIED);
            slotRepo.save(slot);
        }
        log.info("Vehicle {} assigned to slot {}-{}", vehicle.getPlateNumber(), slot.getBlock(), slot.getSlotNumber());
        return toSlotResponse(slotRepo.findById(slotId).orElseThrow());
    }

    /** Remove a specific vehicle from a slot. */
    public ParkingSlotResponse unassignVehicleFromSlot(Long slotId, Long vehicleId) {
        Vehicle vehicle = findVehicle(vehicleId);
        if (vehicle.getAssignedSlot() == null || !vehicle.getAssignedSlot().getId().equals(slotId))
            throw new IllegalStateException("Vehicle is not assigned to this slot");
        ParkingSlot slot = vehicle.getAssignedSlot();
        vehicle.setAssignedSlot(null);
        vehicleRepo.save(vehicle);
        refreshSlotStatus(slot);
        return toSlotResponse(slotRepo.findById(slotId).orElseThrow());
    }

    /** Remove ALL vehicles from a slot (admin use). */
    public ParkingSlotResponse unassignSlot(Long slotId) {
        ParkingSlot slot = findSlot(slotId);
        // Detach all vehicles
        vehicleRepo.findByAssignedSlotId(slotId).forEach(v -> {
            v.setAssignedSlot(null);
            vehicleRepo.save(v);
        });
        slot.setStatus(SlotStatus.AVAILABLE);
        return toSlotResponse(slotRepo.save(slot));
    }

    // ── Visitor Vehicles ──────────────────────────────────────────────────────

    public VisitorVehicle logVisitorEntry(VisitorVehicleRequest req, String guardEmail) {
        User guard = findUser(guardEmail);
        ParkingSlot slot = req.getSlotId() != null ? findSlot(req.getSlotId()) : null;

        VisitorVehicle vv = VisitorVehicle.builder()
            .plateNumber(req.getPlateNumber().toUpperCase())
            .vehicleDescription(req.getVehicleDescription())
            .hostFlat(req.getHostFlat())
            .visitorName(req.getVisitorName())
            .visitorPhone(req.getVisitorPhone())
            .slot(slot)
            .loggedBy(guard)
            .notes(req.getNotes())
            .build();

        if (slot != null) {
            slot.setStatus(SlotStatus.OCCUPIED);
            slotRepo.save(slot);
        }
        log.info("Visitor vehicle {} entered, visiting {}", req.getPlateNumber(), req.getHostFlat());
        return visitorRepo.save(vv);
    }

    public VisitorVehicle logVisitorExit(Long id, String guardEmail) {
        VisitorVehicle vv = visitorRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Visitor vehicle not found"));
        vv.setExitedAt(LocalDateTime.now());
        if (vv.getSlot() != null) {
            vv.getSlot().setStatus(SlotStatus.AVAILABLE);
            slotRepo.save(vv.getSlot());
        }
        log.info("Visitor vehicle {} exited", vv.getPlateNumber());
        return visitorRepo.save(vv);
    }

    // ── Violations ────────────────────────────────────────────────────────────

    public ParkingViolation reportViolation(ParkingViolationRequest req, String reporterEmail,
                                            MultipartFile photo) throws IOException {
        User reporter = findUser(reporterEmail);
        Vehicle vehicle = req.getVehicleId() != null ? findVehicle(req.getVehicleId()) : null;
        ParkingSlot slot = req.getSlotId() != null ? findSlot(req.getSlotId()) : null;

        ParkingViolation violation = ParkingViolation.builder()
            .vehicle(vehicle)
            .plateNumber(req.getPlateNumber().toUpperCase())
            .slot(slot)
            .violationType(req.getViolationType())
            .description(req.getDescription())
            .reportedBy(reporter)
            .resolved(false)
            .build();

        if (photo != null && !photo.isEmpty()) {
            violation.setPhotoPath(savePhoto(photo, "violation_" + System.currentTimeMillis()));
        }
        log.info("Violation reported for plate {} by {}", req.getPlateNumber(), reporterEmail);
        return violationRepo.save(violation);
    }

    public ParkingViolation resolveViolation(Long id, String note, String resolverEmail) {
        ParkingViolation v = violationRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Violation not found"));
        User resolver = findUser(resolverEmail);
        v.setResolved(true);
        v.setResolutionNote(note);
        v.setResolvedBy(resolver);
        v.setResolvedAt(LocalDateTime.now());
        return violationRepo.save(v);
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VehicleResponse> getMyVehicles(String email) {
        return vehicleRepo.findByOwnerEmailOrderByCreatedAtDesc(email)
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getAllVehicles() {
        return vehicleRepo.findAllByOrderByCreatedAtDesc()
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getPendingVehicles() {
        return vehicleRepo.findByStatusOrderByCreatedAtDesc(VehicleStatus.PENDING)
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getApprovedForGuard() {
        return vehicleRepo.findApprovedForGuardView()
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleResponse getVehicleById(Long id) {
        return toResponse(findVehicle(id));
    }

    @Transactional(readOnly = true)
    public List<ParkingSlotResponse> getAllSlots() {
        return slotRepo.findAllByOrderByBlockAscSlotNumberAsc()
            .stream().map(this::toSlotResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ParkingSlotResponse> getAvailableSlots() {
        return slotRepo.findAvailable()
            .stream().map(this::toSlotResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VisitorVehicle> getCurrentVisitors() {
        return visitorRepo.findCurrentlyInside();
    }

    @Transactional(readOnly = true)
    public List<VisitorVehicle> getAllVisitorLogs() {
        return visitorRepo.findAllOrderByEnteredAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ParkingViolation> getAllViolations() {
        return violationRepo.findAllOrderByReportedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ParkingViolation> getUnresolvedViolations() {
        return violationRepo.findUnresolved();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        long totalSlots     = slotRepo.count();
        long occupied       = slotRepo.countByStatus(SlotStatus.OCCUPIED);
        long available      = slotRepo.countByStatus(SlotStatus.AVAILABLE);
        long pending        = vehicleRepo.countByStatus(VehicleStatus.PENDING);
        long approved       = vehicleRepo.countByStatus(VehicleStatus.APPROVED);
        long visitorsNow    = visitorRepo.findCurrentlyInside().size();
        long openViolations = violationRepo.countByResolvedFalse();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalSlots",     totalSlots);
        stats.put("occupied",       occupied);
        stats.put("available",      available);
        stats.put("pendingApproval",pending);
        stats.put("registeredVehicles", approved);
        stats.put("visitorsNow",    visitorsNow);
        stats.put("openViolations", openViolations);
        return stats;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String savePhoto(MultipartFile file, String prefix) throws IOException {
        Path dir = Path.of(UPLOAD_DIR);
        Files.createDirectories(dir);
        String ext = Objects.requireNonNull(file.getOriginalFilename()).contains(".")
            ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf('.') + 1) : "jpg";
        String name = prefix + "_" + UUID.randomUUID() + "." + ext;
        Files.copy(file.getInputStream(), dir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
        return dir.resolve(name).toString();
    }

    private VehicleResponse toResponse(Vehicle v) {
        long violations = violationRepo.findByVehicleIdOrderByReportedAtDesc(v.getId()).size();
        String slotLabel = null;
        Long slotId = null;
        if (v.getAssignedSlot() != null) {
            ParkingSlot s = v.getAssignedSlot();
            slotLabel = s.getBlock() + " · " + s.getSlotNumber() + (s.getLevel() != null ? " · " + s.getLevel() : "");
            slotId = s.getId();
        }
        return VehicleResponse.builder()
            .id(v.getId())
            .plateNumber(v.getPlateNumber())
            .type(v.getType())
            .make(v.getMake())
            .model(v.getModel())
            .colour(v.getColour())
            .year(v.getYear())
            .status(v.getStatus())
            .adminNote(v.getAdminNote())
            .photoUrl(v.getPhotoPath() != null ? "/api/vehicles/photo/" + v.getId() : null)
            .ownerName(v.getOwner().getFirstName() + " " + v.getOwner().getLastName())
            .ownerFlat(v.getOwner().getFlatNumber())
            .ownerBlock(v.getOwner().getBlock())
            .ownerPhone(v.getOwner().getPhone())
            .assignedSlotId(slotId)
            .assignedSlotLabel(slotLabel)
            .violationCount(violations)
            .createdAt(v.getCreatedAt())
            .approvedAt(v.getApprovedAt())
            .build();
    }

    private ParkingSlotResponse toSlotResponse(ParkingSlot s) {
        String label = s.getBlock() + " · " + s.getSlotNumber() + (s.getLevel() != null ? " · " + s.getLevel() : "");
        List<ParkingSlotResponse.VehicleInfo> vehicleInfos = vehicleRepo.findByAssignedSlotId(s.getId())
            .stream().map(v -> ParkingSlotResponse.VehicleInfo.builder()
                .id(v.getId())
                .plate(v.getPlateNumber())
                .type(v.getType())
                .description(v.getColour() + " " + v.getMake() + " " + v.getModel())
                .ownerName(v.getOwner().getFirstName() + " " + v.getOwner().getLastName())
                .ownerFlat((v.getOwner().getBlock() != null ? v.getOwner().getBlock() + "-" : "") + v.getOwner().getFlatNumber())
                .build())
            .collect(Collectors.toList());
        return ParkingSlotResponse.builder()
            .id(s.getId())
            .block(s.getBlock())
            .slotNumber(s.getSlotNumber())
            .level(s.getLevel())
            .type(s.getType())
            .status(s.getStatus())
            .notes(s.getNotes())
            .label(label)
            .vehicles(vehicleInfos)
            .createdAt(s.getCreatedAt())
            .build();
    }

    /** Refresh slot OCCUPIED/AVAILABLE status based on whether a CAR is present. */
    private void refreshSlotStatus(ParkingSlot slot) {
        boolean hasCar = vehicleRepo.existsByAssignedSlotIdAndType(slot.getId(), VehicleType.CAR);
        slot.setStatus(hasCar ? SlotStatus.OCCUPIED : SlotStatus.AVAILABLE);
        slotRepo.save(slot);
    }

    /** Enforce: max 1 CAR per slot. */
    private void assertCarRule(Long slotId, Vehicle vehicle) {
        if (vehicle.getType() == VehicleType.CAR
                && vehicleRepo.existsByAssignedSlotIdAndType(slotId, VehicleType.CAR)) {
            throw new IllegalStateException("Slot already has a car assigned. Only bikes/scooters can share this slot.");
        }
    }

    private void assertOwnerOrManager(Vehicle v, String email) {
        User user = findUser(email);
        boolean isOwner   = v.getOwner().getEmail().equals(email);
        boolean isManager = user.getRole() == Role.ADMIN
            || user.getRole() == Role.FACILITY_MANAGER
            || user.getRole() == Role.PRESIDENT
            || user.getRole() == Role.SECRETARY;
        if (!isOwner && !isManager)
            throw new SecurityException("Not authorised to modify this vehicle");
    }

    private Vehicle      findVehicle(Long id) { return vehicleRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Vehicle not found")); }
    private ParkingSlot  findSlot(Long id)    { return slotRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Parking slot not found")); }
    private User         findUser(String email){ return userRepo.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found")); }
}
