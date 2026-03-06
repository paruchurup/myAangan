package com.myaangan.controller;

import com.myaangan.dto.UserDto.ApiResponse;
import com.myaangan.dto.VisitorPassRequest;
import com.myaangan.service.VisitorPassService;
import com.myaangan.service.VisitorPassService.PassValidationResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/passes")
@RequiredArgsConstructor
public class VisitorPassController {

    private final VisitorPassService svc;

    // ── Resident: manage own passes ───────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VISITOR_PASS_CREATE')")
    @PostMapping
    public ResponseEntity<?> createPass(@RequestBody VisitorPassRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Pass created", svc.createPass(req, auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VISITOR_PASS_CREATE')")
    @GetMapping("/my")
    public ResponseEntity<?> getMyPasses(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("OK", svc.getMyPasses(auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VISITOR_PASS_CREATE')")
    @GetMapping("/my/{id}")
    public ResponseEntity<?> getPassById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("OK", svc.getPassById(id, auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VISITOR_PASS_CREATE')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelPass(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Pass cancelled", svc.cancelPass(id, auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VISITOR_PASS_CREATE')")
    @GetMapping("/{id}/logs")
    public ResponseEntity<?> getPassLogs(@PathVariable Long id, Authentication auth) {
        // Residents can only see logs for their own passes (service enforces)
        svc.getPassById(id, auth.getName()); // ownership check
        return ResponseEntity.ok(ApiResponse.success("OK", svc.getPassLogs(id)));
    }

    // ── Guard: validate + check-in ────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VISITOR_VEHICLE_LOG')")
    @GetMapping("/validate/{token}")
    public ResponseEntity<?> validateToken(@PathVariable String token) {
        PassValidationResult result = svc.validateToken(token.toUpperCase());
        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VISITOR_VEHICLE_LOG')")
    @PostMapping("/checkin")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, String> body, Authentication auth) {
        String  token          = body.getOrDefault("token", "").toUpperCase();
        boolean override       = "true".equalsIgnoreCase(body.get("override"));
        String  overrideReason = body.get("overrideReason");
        return ResponseEntity.ok(ApiResponse.success("Checked in",
            svc.checkIn(token, auth.getName(), override, overrideReason)));
    }

    // ── Admin / FM: all passes ────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VEHICLE_MANAGE')")
    @GetMapping
    public ResponseEntity<?> getAllPasses() {
        return ResponseEntity.ok(ApiResponse.success("OK", svc.getAllPasses()));
    }
}
