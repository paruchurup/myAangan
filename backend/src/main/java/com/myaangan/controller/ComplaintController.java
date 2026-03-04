package com.myaangan.controller;

import com.myaangan.dto.*;
import com.myaangan.enums.ComplaintStatus;
import com.myaangan.enums.EscalationLevel;
import com.myaangan.service.ComplaintService;
import com.myaangan.service.ComplaintPdfService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService svc;
    private final ComplaintPdfService pdfSvc;

    // ── Raise new complaint (with optional file attachments) ─────────────────
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','RESIDENT','VOLUNTEER','SECURITY_GUARD','FACILITY_MANAGER')")
    public ResponseEntity<UserDto.ApiResponse<ComplaintResponse>> raise(
            @RequestPart("data") @Valid ComplaintRequest req,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails user) throws Exception {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Complaint raised",
            svc.raiseComplaint(req, user.getUsername(), files)));
    }

    // ── My complaints (resident / guard view their own) ───────────────────────
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto.ApiResponse<List<ComplaintResponse>>> mine(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            svc.getMyComplaints(user.getUsername())));
    }

    // ── All complaints (FM / Admin) ───────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACILITY_MANAGER','PRESIDENT','SECRETARY','VOLUNTEER')")
    public ResponseEntity<UserDto.ApiResponse<List<ComplaintResponse>>> all(
            @RequestParam(required = false) ComplaintStatus status,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            svc.getAllComplaints(status, user.getUsername())));
    }

    // ── Escalated complaints (BM sees BM+BDA, BDA sees only BDA) ─────────────
    @GetMapping("/escalated")
    @PreAuthorize("hasAnyRole('ADMIN','BUILDER_MANAGER','BDA_ENGINEER')")
    public ResponseEntity<UserDto.ApiResponse<List<ComplaintResponse>>> escalated(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(defaultValue = "BUILDER_MANAGER") EscalationLevel level) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            svc.getEscalatedComplaints(level, user.getUsername())));
    }

    // ── Dashboard stats ───────────────────────────────────────────────────────
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER','PRESIDENT','SECRETARY','VOLUNTEER')")
    public ResponseEntity<UserDto.ApiResponse<Map<String, Long>>> stats() {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK", svc.getDashboardStats()));
    }

    // ── Single complaint detail ───────────────────────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto.ApiResponse<ComplaintResponse>> get(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            svc.getComplaint(id, user.getUsername())));
    }

    // ── Update status ─────────────────────────────────────────────────────────
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER')")
    public ResponseEntity<UserDto.ApiResponse<ComplaintResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintStatusUpdateRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Status updated",
            svc.updateStatus(id, req, user.getUsername())));
    }

    // ── Assign to me (FM takes ownership) ────────────────────────────────────
    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITY_MANAGER')")
    public ResponseEntity<UserDto.ApiResponse<ComplaintResponse>> assign(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Assigned",
            svc.assignToMe(id, user.getUsername())));
    }

    // ── Escalate ──────────────────────────────────────────────────────────────
    @PostMapping("/{id}/escalate")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER')")
    public ResponseEntity<UserDto.ApiResponse<ComplaintResponse>> escalate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Escalated",
            svc.escalate(id, user.getUsername())));
    }

    // ── Add comment ───────────────────────────────────────────────────────────
    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto.ApiResponse<ComplaintResponse.CommentInfo>> comment(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintCommentRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Comment added",
            svc.addComment(id, req, user.getUsername())));
    }

    // ── Add attachments ───────────────────────────────────────────────────────
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto.ApiResponse<List<ComplaintResponse.AttachmentInfo>>> attach(
            @PathVariable Long id,
            @RequestPart("files") List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails user) throws Exception {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Attachments added",
            svc.addAttachments(id, files, user.getUsername())));
    }

    // ── Delete attachment ─────────────────────────────────────────────────────
    @DeleteMapping("/attachments/{attachmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto.ApiResponse<Void>> deleteAttachment(
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal UserDetails user) throws Exception {
        svc.deleteAttachment(attachmentId, user.getUsername());
        return ResponseEntity.ok(UserDto.ApiResponse.success("Deleted", null));
    }
    // ── Generate PDF report ───────────────────────────────────────────────────
    @PostMapping("/report/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','PRESIDENT','SECRETARY','VOLUNTEER')")
    public ResponseEntity<?> downloadPdf(
            @RequestBody PdfReportRequest req,
            @AuthenticationPrincipal UserDetails user) {

        try {
            byte[] pdf = pdfSvc.generateReport(req, user.getUsername());
            String filename = "MyAangan_Complaints_"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmm")) + ".pdf";

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);

        } catch (Exception e) {
            log.error("PDF generation failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("success", false, "message", "PDF generation failed: " + e.getMessage()));
        }
    }
}
