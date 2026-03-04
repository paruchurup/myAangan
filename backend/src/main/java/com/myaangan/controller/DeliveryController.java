package com.myaangan.controller;

import com.myaangan.dto.*;
import com.myaangan.enums.DeliveryStatus;
import com.myaangan.service.DeliveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;

    // ── Guard: Log new delivery ───────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SECURITY_GUARD')")
    public ResponseEntity<UserDto.ApiResponse<DeliveryResponse>> logDelivery(
            @Valid @RequestBody DeliveryRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Delivery logged",
            deliveryService.logDelivery(req, userDetails.getUsername())));
    }

    // ── Guard: Today's all deliveries ─────────────────────────────────────────

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN','SECURITY_GUARD')")
    public ResponseEntity<UserDto.ApiResponse<List<DeliveryResponse>>> getToday() {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            deliveryService.getTodaysDeliveries()));
    }

    // ── Guard: My logged deliveries ───────────────────────────────────────────

    @GetMapping("/my-logged")
    @PreAuthorize("hasAnyRole('ADMIN','SECURITY_GUARD')")
    public ResponseEntity<UserDto.ApiResponse<List<DeliveryResponse>>> getMyLogged(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            deliveryService.getMyLoggedDeliveries(userDetails.getUsername())));
    }

    // ── Guard: Search flat numbers (autocomplete) ─────────────────────────────

    @GetMapping("/flats/search")
    @PreAuthorize("hasAnyRole('ADMIN','SECURITY_GUARD')")
    public ResponseEntity<UserDto.ApiResponse<List<String>>> searchFlats(
            @RequestParam String query) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            deliveryService.searchFlats(query)));
    }

    // ── Resident: My pending deliveries ──────────────────────────────────────

    @GetMapping("/my-pending")
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER')")
    public ResponseEntity<UserDto.ApiResponse<List<DeliveryResponse>>> getMyPending(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            deliveryService.getMyPendingDeliveries(userDetails.getUsername())));
    }

    // ── Resident: Pending badge count ─────────────────────────────────────────

    @GetMapping("/my-pending/count")
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER')")
    public ResponseEntity<UserDto.ApiResponse<Map<String, Long>>> getPendingCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        long count = deliveryService.getPendingCount(userDetails.getUsername());
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            Map.of("count", count)));
    }

    // ── Resident: Full delivery history ──────────────────────────────────────

    @GetMapping("/my-history")
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER')")
    public ResponseEntity<UserDto.ApiResponse<List<DeliveryResponse>>> getMyHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            deliveryService.getMyDeliveryHistory(userDetails.getUsername())));
    }

    // ── Admin: All deliveries (optional filter by status) ────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<List<DeliveryResponse>>> getAll(
            @RequestParam(required = false) DeliveryStatus status) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            deliveryService.getAllDeliveries(status)));
    }

    // ── Get single delivery ───────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SECURITY_GUARD','RESIDENT','VOLUNTEER')")
    public ResponseEntity<UserDto.ApiResponse<DeliveryResponse>> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            deliveryService.getById(id)));
    }

    // ── Update status (Guard marks collected/returned, Resident acknowledges) ─

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','SECURITY_GUARD','RESIDENT','VOLUNTEER')")
    public ResponseEntity<UserDto.ApiResponse<DeliveryResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryStatusUpdateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Status updated",
            deliveryService.updateStatus(id, req, userDetails.getUsername())));
    }

    // ── OTP: Guard generates OTP to show resident ─────────────────────────────
    @PostMapping("/{id}/otp/generate-guard")
    @PreAuthorize("hasAnyRole('ADMIN','SECURITY_GUARD')")
    public ResponseEntity<UserDto.ApiResponse<OtpGenerateResponse>> generateGuardOtp(
            @PathVariable Long id) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OTP generated",
            deliveryService.generateOtp(id, "GUARD")));
    }

    // ── OTP: Resident generates OTP to show guard ─────────────────────────────
    @PostMapping("/{id}/otp/generate-resident")
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER')")
    public ResponseEntity<UserDto.ApiResponse<OtpGenerateResponse>> generateResidentOtp(
            @PathVariable Long id) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OTP generated",
            deliveryService.generateOtp(id, "RESIDENT")));
    }

    // ── OTP: Verify OTP (guard enters OTP shown by resident, or vice versa) ──
    @PostMapping("/{id}/otp/verify")
    @PreAuthorize("hasAnyRole('ADMIN','SECURITY_GUARD','RESIDENT','VOLUNTEER')")
    public ResponseEntity<UserDto.ApiResponse<DeliveryResponse>> verifyOtp(
            @PathVariable Long id,
            @Valid @RequestBody OtpVerifyRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OTP verified — delivery collected!",
            deliveryService.verifyOtp(id, req, null)));
    }
}
