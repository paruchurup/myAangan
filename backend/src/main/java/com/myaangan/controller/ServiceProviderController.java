package com.myaangan.controller;

import com.myaangan.dto.*;
import com.myaangan.service.ServiceProviderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/services/providers")
@RequiredArgsConstructor
public class ServiceProviderController {

    private final ServiceProviderService providerService;

    @Value("${app.upload.dir:/app/uploads/photos}")
    private String uploadDir;

    // ── Diagnostics (Admin only) ──────────────────────────────────────────────
    // Hit GET /api/services/providers/upload-check to diagnose photo issues
    @GetMapping("/upload-check")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<Map<String, Object>>> uploadCheck() {
        Path p = Paths.get(uploadDir);
        Map<String, Object> info = Map.of(
            "uploadDir",   uploadDir,
            "exists",      Files.exists(p),
            "isDirectory", Files.isDirectory(p),
            "isWritable",  Files.isWritable(p),
            "absolutePath", p.toAbsolutePath().toString()
        );
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK", info));
    }

    // ── List ──────────────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER','SECURITY_GUARD','FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER','PRESIDENT','SECRETARY')")
    public ResponseEntity<UserDto.ApiResponse<List<ProviderSummaryResponse>>> getAll(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "highest_rated") String sort) {
        return ResponseEntity.ok(
            UserDto.ApiResponse.success("OK", providerService.getAll(categoryId, search, sort)));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER','SECURITY_GUARD','FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER','PRESIDENT','SECRETARY')")
    public ResponseEntity<UserDto.ApiResponse<List<ProviderSummaryResponse>>> getMyProviders(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            UserDto.ApiResponse.success("OK",
                providerService.getMyProviders(userDetails.getUsername())));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER','SECURITY_GUARD','FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER','PRESIDENT','SECRETARY')")
    public ResponseEntity<UserDto.ApiResponse<ProviderDetailResponse>> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(
            UserDto.ApiResponse.success("OK", providerService.getById(id)));
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER','SECURITY_GUARD','FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER','PRESIDENT','SECRETARY')")
    public ResponseEntity<UserDto.ApiResponse<ProviderSummaryResponse>> create(
            @Valid @RequestBody ProviderRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            UserDto.ApiResponse.success("Provider added successfully",
                providerService.create(req, userDetails.getUsername())));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER','SECURITY_GUARD','FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER','PRESIDENT','SECRETARY')")
    public ResponseEntity<UserDto.ApiResponse<ProviderSummaryResponse>> update(
            @PathVariable Long id,
            @RequestBody ProviderUpdateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            UserDto.ApiResponse.success("Provider updated",
                providerService.update(id, req, userDetails.getUsername())));
    }

    // ── Photo Upload ──────────────────────────────────────────────────────────

    @PostMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER','SECURITY_GUARD','FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER','PRESIDENT','SECRETARY')")
    public ResponseEntity<UserDto.ApiResponse<ProviderSummaryResponse>> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        log.info("Photo upload request: providerId={}, user={}, size={}, type={}",
            id, userDetails.getUsername(), file.getSize(), file.getContentType());
        return ResponseEntity.ok(
            UserDto.ApiResponse.success("Photo uploaded",
                providerService.uploadPhoto(id, file, userDetails.getUsername())));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<Void>> delete(@PathVariable Long id) {
        providerService.delete(id);
        return ResponseEntity.ok(UserDto.ApiResponse.success("Provider removed", null));
    }

    // ── Reviews ───────────────────────────────────────────────────────────────

    @PostMapping("/{id}/reviews")
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER','SECURITY_GUARD','FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER','PRESIDENT','SECRETARY')")
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
