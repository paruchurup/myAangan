package com.myaangan.controller;

import com.myaangan.dto.UserDto;
import com.myaangan.dto.UserDto.ApiResponse;
import com.myaangan.service.VaultService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/api/vault")
@RequiredArgsConstructor
public class VaultController {

    private final VaultService svc;

    @Value("${app.upload.vault.dir:/app/uploads/vault}")
    private String vaultDir;

    // ── Upload document (Admin / President / Secretary) ───────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VAULT_UPLOAD')")
    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam String type,
            @RequestParam(required = false) String residentEmail,
            @RequestParam(required = false) Long nocRequestId,
            @RequestParam(required = false) String expiryDate,
            @RequestParam MultipartFile file,
            Authentication auth) throws Exception {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Document uploaded",
            svc.uploadDocument(title, description, type, residentEmail,
                nocRequestId, expiryDate, file, auth.getName())));
    }

    // ── Delete document ───────────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VAULT_UPLOAD')")
    @DeleteMapping("/documents/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        svc.deleteDocument(id, auth.getName());
        return ResponseEntity.ok(UserDto.ApiResponse.success( "Document removed", null));
    }

    // ── Resident: view own vault ──────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VAULT_VIEW')")
    @GetMapping("/my")
    public ResponseEntity<?> myVault(Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "OK",
            svc.getResidentVault(auth.getName())));
    }

    // ── Admin: full vault view ────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VAULT_UPLOAD')")
    @GetMapping("/admin")
    public ResponseEntity<?> adminVault() {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "OK", svc.getAdminVault()));
    }

    // ── Admin: pending NOC requests ───────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VAULT_UPLOAD')")
    @GetMapping("/noc-requests/pending")
    public ResponseEntity<?> pendingNocs() {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "OK", svc.getPendingNocRequests()));
    }

    // ── Resident: request an NOC ──────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VAULT_NOC_REQUEST')")
    @PostMapping("/noc-requests")
    public ResponseEntity<?> requestNoc(@RequestBody Map<String, String> body, Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "NOC request submitted",
            svc.requestNoc(body.get("purpose"), body.get("details"), auth.getName())));
    }

    // ── Admin: reject an NOC request ─────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VAULT_UPLOAD')")
    @PostMapping("/noc-requests/{id}/reject")
    public ResponseEntity<?> rejectNoc(@PathVariable Long id,
                                        @RequestBody Map<String, String> body,
                                        Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("NOC request rejected",
            svc.rejectNocRequest(id, body.get("reason"), auth.getName())));
    }

    // ── View single document (access-checked) ────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VAULT_VIEW')")
    @GetMapping("/documents/{id}")
    public ResponseEntity<?> getDoc(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            svc.getDocument(id, auth.getName())));
    }

    // ── Download / serve file ─────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'VAULT_VIEW')")
    @GetMapping("/documents/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id, Authentication auth) {
        try {
            var doc = svc.getDocument(id, auth.getName()); // access check
            Resource r = new FileSystemResource(Paths.get(vaultDir, doc.getFilePath()).normalize());
            if (!r.exists()) return ResponseEntity.notFound().build();

            MediaType mt = switch (doc.getFileFormat()) {
                case "PDF"  -> MediaType.APPLICATION_PDF;
                case "JPG"  -> MediaType.IMAGE_JPEG;
                case "PNG"  -> MediaType.IMAGE_PNG;
                default     -> MediaType.APPLICATION_OCTET_STREAM;
            };
            String disposition = "DOCX".equals(doc.getFileFormat()) ? "attachment" : "inline";
            return ResponseEntity.ok()
                .contentType(mt)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    disposition + "; filename=\"" + doc.getTitle() + "." + doc.getFileFormat().toLowerCase() + "\"")
                .body(r);
        } catch (Exception e) { return ResponseEntity.notFound().build(); }
    }
}
