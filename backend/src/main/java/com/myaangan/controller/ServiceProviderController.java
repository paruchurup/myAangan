package com.myaangan.controller;

import com.myaangan.dto.*;
import com.myaangan.service.ServiceProviderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services/providers")
@RequiredArgsConstructor
public class ServiceProviderController {

    private final ServiceProviderService providerService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','SECURITY_GUARD')")
    public ResponseEntity<UserDto.ApiResponse<List<ProviderSummaryResponse>>> getAll(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(
            UserDto.ApiResponse.success("OK", providerService.getAll(categoryId, search)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','SECURITY_GUARD')")
    public ResponseEntity<UserDto.ApiResponse<ProviderDetailResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK", providerService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT')")
    public ResponseEntity<UserDto.ApiResponse<ProviderSummaryResponse>> create(
            @Valid @RequestBody ProviderRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            UserDto.ApiResponse.success("Provider added successfully",
                providerService.create(req, userDetails.getUsername())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','SECURITY_GUARD')")
    public ResponseEntity<UserDto.ApiResponse<ProviderSummaryResponse>> update(
            @PathVariable Long id,
            @RequestBody ProviderUpdateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            UserDto.ApiResponse.success("Provider updated",
                providerService.update(id, req, userDetails.getUsername())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<Void>> delete(@PathVariable Long id) {
        providerService.delete(id);
        return ResponseEntity.ok(UserDto.ApiResponse.success("Provider removed", null));
    }

    @PostMapping("/{id}/reviews")
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','SECURITY_GUARD')")
    public ResponseEntity<UserDto.ApiResponse<ReviewResponse>> addOrUpdateReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            UserDto.ApiResponse.success("Review submitted",
                providerService.addOrUpdateReview(id, req, userDetails.getUsername())));
    }

    @DeleteMapping("/{providerId}/reviews/{reviewId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<Void>> deleteReview(
            @PathVariable Long providerId,
            @PathVariable Long reviewId) {
        providerService.deleteReview(providerId, reviewId);
        return ResponseEntity.ok(UserDto.ApiResponse.success("Review deleted", null));
    }
}
