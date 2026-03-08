package com.myaangan.controller;

import com.myaangan.dto.UserDto.ApiResponse;
import com.myaangan.entity.MaintenanceConfig;
import com.myaangan.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService svc;

    @Value("${app.upload.receipts.dir:/app/uploads/receipts}")
    private String receiptsDir;

    // ── Config ────────────────────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'MAINTENANCE_MANAGE')")
    @GetMapping("/config")
    public ResponseEntity<?> getConfig() {
        var cfg = svc.getConfig();
        // Never return secret to frontend
        cfg.setRazorpayKeySecret(null);
        return ResponseEntity.ok(ApiResponse.success("OK", cfg));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'MAINTENANCE_MANAGE')")
    @PutMapping("/config")
    public ResponseEntity<?> updateConfig(@RequestBody MaintenanceConfig req, Authentication auth) {
        var cfg = svc.updateConfig(req, auth.getName());
        cfg.setRazorpayKeySecret(null);
        return ResponseEntity.ok(ApiResponse.success("Config updated", cfg));
    }

    // ── Bill generation (admin trigger + auto) ────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'MAINTENANCE_MANAGE')")
    @PostMapping("/generate")
    public ResponseEntity<?> generateBills(@RequestBody(required = false) Map<String, Integer> body) {
        LocalDate now = LocalDate.now();
        int year  = body != null && body.containsKey("year")  ? body.get("year")  : now.getYear();
        int month = body != null && body.containsKey("month") ? body.get("month") : now.getMonthValue();
        int count = svc.generateBillsForMonth(year, month);
        return ResponseEntity.ok(ApiResponse.success(count + " bills generated", count));
    }

    // ── Resident: own bills ───────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'MAINTENANCE_VIEW')")
    @GetMapping("/my")
    public ResponseEntity<?> getMyBills(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("OK", svc.getMyBills(auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'MAINTENANCE_VIEW')")
    @GetMapping("/my/outstanding")
    public ResponseEntity<?> getMyOutstanding(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("OK", svc.getMyOutstanding(auth.getName())));
    }

    // ── Razorpay: create order ────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'MAINTENANCE_PAY')")
    @PostMapping("/bills/{id}/pay")
    public ResponseEntity<?> createOrder(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Order created",
            svc.createPaymentOrder(id, auth.getName())));
    }

    // ── Razorpay: webhook (public — signature-verified inside service) ─────

    @PostMapping("/webhook/razorpay")
    public ResponseEntity<?> razorpayWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String sig) {
        try {
            svc.handleWebhook(payload, sig != null ? sig : "");
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            log.error("Webhook error: {}", e.getMessage());
            return ResponseEntity.ok().build(); // always 200 to Razorpay
        }
    }

    // ── Receipt download ──────────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'MAINTENANCE_VIEW')")
    @GetMapping("/receipts/{filename}")
    public ResponseEntity<Resource> downloadReceipt(@PathVariable String filename) {
        try {
            var path = Paths.get(receiptsDir).resolve(filename).normalize();
            Resource resource = new FileSystemResource(path);
            if (!resource.exists()) return ResponseEntity.notFound().build();
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Admin views ───────────────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'MAINTENANCE_MANAGE')")
    @GetMapping("/bills")
    public ResponseEntity<?> getBillsForMonth(
            @RequestParam(defaultValue = "0") int year,
            @RequestParam(defaultValue = "0") int month) {
        LocalDate now = LocalDate.now();
        if (year  == 0) year  = now.getYear();
        if (month == 0) month = now.getMonthValue();
        return ResponseEntity.ok(ApiResponse.success("OK", svc.getBillsForMonth(year, month)));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'MAINTENANCE_MANAGE')")
    @GetMapping("/defaulters")
    public ResponseEntity<?> getDefaulters() {
        return ResponseEntity.ok(ApiResponse.success("OK", svc.getDefaulters()));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'MAINTENANCE_MANAGE')")
    @GetMapping("/summary")
    public ResponseEntity<?> getMonthlySummary() {
        return ResponseEntity.ok(ApiResponse.success("OK", svc.getMonthlySummary()));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'MAINTENANCE_MANAGE')")
    @PostMapping("/bills/{id}/waive")
    public ResponseEntity<?> waiveBill(@PathVariable Long id,
                                        @RequestBody Map<String, String> body,
                                        Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("Bill waived",
            svc.waiveBill(id, body.getOrDefault("note", ""), auth.getName())));
    }
}
