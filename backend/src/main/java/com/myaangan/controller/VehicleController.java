package com.myaangan.controller;

import com.myaangan.dto.*;
import com.myaangan.entity.ParkingViolation;
import com.myaangan.entity.VisitorVehicle;
import com.myaangan.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService svc;

    // ── Resident: own vehicles ────────────────────────────────────────────────

    @GetMapping("/my")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_REGISTER')")
    public ResponseEntity<UserDto.ApiResponse<List<VehicleResponse>>> myVehicles(
            @AuthenticationPrincipal UserDetails u) {
        return ok("OK", svc.getMyVehicles(u.getUsername()));
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_REGISTER')")
    public ResponseEntity<UserDto.ApiResponse<VehicleResponse>> register(
            @RequestPart("data") @Valid VehicleRequest req,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @AuthenticationPrincipal UserDetails u) throws Exception {
        return ok("Vehicle registered — pending approval", svc.registerVehicle(req, u.getUsername(), photo));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_REGISTER')")
    public ResponseEntity<UserDto.ApiResponse<VehicleResponse>> update(
            @PathVariable Long id,
            @RequestPart("data") @Valid VehicleRequest req,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @AuthenticationPrincipal UserDetails u) throws Exception {
        return ok("Vehicle updated", svc.updateVehicle(id, req, u.getUsername(), photo));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_REGISTER')")
    public ResponseEntity<UserDto.ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails u) {
        svc.deleteVehicle(id, u.getUsername());
        return ok("Deleted", null);
    }

    @PostMapping("/my/slot")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_REGISTER')")
    public ResponseEntity<UserDto.ApiResponse<ParkingSlotResponse>> claimMySlot(
            @RequestBody @Valid ParkingSlotRequest req,
            @AuthenticationPrincipal UserDetails u) {
        return ok("Parking slot claimed", svc.claimMySlot(req, u.getUsername()));
    }

    // ── Guard: verified vehicle lookup ────────────────────────────────────────

    @GetMapping("/guard/approved")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_VIEW_ALL')")
    public ResponseEntity<UserDto.ApiResponse<List<VehicleResponse>>> approvedForGuard() {
        return ok("OK", svc.getApprovedForGuard());
    }

    // ── Admin / FM: vehicle management ────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<List<VehicleResponse>>> all() {
        return ok("OK", svc.getAllVehicles());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<List<VehicleResponse>>> pending() {
        return ok("OK", svc.getPendingVehicles());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<VehicleResponse>> getById(@PathVariable Long id) {
        return ok("OK", svc.getVehicleById(id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<VehicleResponse>> approve(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails u) {
        return ok("Approved", svc.approveVehicle(id, u.getUsername()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<VehicleResponse>> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails u) {
        return ok("Rejected", svc.rejectVehicle(id, body.get("reason"), u.getUsername()));
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<VehicleResponse>> suspend(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails u) {
        return ok("Suspended", svc.suspendVehicle(id, body.get("reason"), u.getUsername()));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<Map<String, Object>>> stats() {
        return ok("OK", svc.getDashboardStats());
    }

    // ── Parking slots ─────────────────────────────────────────────────────────

    @GetMapping("/slots")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_VIEW_ALL') or @perm.has(authentication, 'PARKING_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<List<ParkingSlotResponse>>> slots() {
        return ok("OK", svc.getAllSlots());
    }

    @GetMapping("/slots/available")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<List<ParkingSlotResponse>>> availableSlots() {
        return ok("OK", svc.getAvailableSlots());
    }

    @PostMapping("/slots")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'PARKING_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<ParkingSlotResponse>> createSlot(
            @RequestBody @Valid ParkingSlotRequest req) {
        return ok("Slot created", svc.createSlot(req));
    }

    @PutMapping("/slots/{id}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'PARKING_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<ParkingSlotResponse>> updateSlot(
            @PathVariable Long id, @RequestBody @Valid ParkingSlotRequest req) {
        return ok("Updated", svc.updateSlot(id, req));
    }

    @DeleteMapping("/slots/{id}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'PARKING_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<Void>> deleteSlot(@PathVariable Long id) {
        svc.deleteSlot(id);
        return ok("Deleted", null);
    }

    @PostMapping("/slots/{slotId}/assign/{vehicleId}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'PARKING_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<ParkingSlotResponse>> assignVehicle(
            @PathVariable Long slotId, @PathVariable Long vehicleId) {
        return ok("Vehicle assigned to slot", svc.assignVehicleToSlot(slotId, vehicleId));
    }

    @PostMapping("/slots/{slotId}/unassign")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'PARKING_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<ParkingSlotResponse>> unassignSlot(@PathVariable Long slotId) {
        return ok("All vehicles removed from slot", svc.unassignSlot(slotId));
    }

    @PostMapping("/slots/{slotId}/unassign/{vehicleId}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'PARKING_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<ParkingSlotResponse>> unassignVehicle(
            @PathVariable Long slotId, @PathVariable Long vehicleId) {
        return ok("Vehicle removed from slot", svc.unassignVehicleFromSlot(slotId, vehicleId));
    }

    // ── Visitor vehicles ──────────────────────────────────────────────────────

    @GetMapping("/visitors/current")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VISITOR_VEHICLE_LOG')")
    public ResponseEntity<UserDto.ApiResponse<List<VisitorVehicle>>> currentVisitors() {
        return ok("OK", svc.getCurrentVisitors());
    }

    @GetMapping("/visitors")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<List<VisitorVehicle>>> allVisitorLogs() {
        return ok("OK", svc.getAllVisitorLogs());
    }

    @PostMapping("/visitors/entry")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VISITOR_VEHICLE_LOG')")
    public ResponseEntity<UserDto.ApiResponse<VisitorVehicle>> visitorEntry(
            @RequestBody @Valid VisitorVehicleRequest req,
            @AuthenticationPrincipal UserDetails u) {
        return ok("Visitor vehicle logged", svc.logVisitorEntry(req, u.getUsername()));
    }

    @PostMapping("/visitors/{id}/exit")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VISITOR_VEHICLE_LOG')")
    public ResponseEntity<UserDto.ApiResponse<VisitorVehicle>> visitorExit(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails u) {
        return ok("Exit recorded", svc.logVisitorExit(id, u.getUsername()));
    }

    // ── Violations ────────────────────────────────────────────────────────────

    @GetMapping("/violations")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<List<ParkingViolation>>> violations() {
        return ok("OK", svc.getAllViolations());
    }

    @GetMapping("/violations/open")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VISITOR_VEHICLE_LOG')")
    public ResponseEntity<UserDto.ApiResponse<List<ParkingViolation>>> openViolations() {
        return ok("OK", svc.getUnresolvedViolations());
    }

    @PostMapping(value = "/violations", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VISITOR_VEHICLE_LOG')")
    public ResponseEntity<UserDto.ApiResponse<ParkingViolation>> reportViolation(
            @RequestPart("data") @Valid ParkingViolationRequest req,
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @AuthenticationPrincipal UserDetails u) throws Exception {
        return ok("Violation reported", svc.reportViolation(req, u.getUsername(), photo));
    }

    @PostMapping("/violations/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<ParkingViolation>> resolveViolation(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails u) {
        return ok("Resolved", svc.resolveViolation(id, body.get("note"), u.getUsername()));
    }

    private <T> ResponseEntity<UserDto.ApiResponse<T>> ok(String msg, T data) {
        return ResponseEntity.ok(UserDto.ApiResponse.success(msg, data));
    }
}
