package com.myaangan.controller;

import com.myaangan.dto.UserDto;
import com.myaangan.dto.UserDto.ApiResponse;
import com.myaangan.service.HelpdeskService;
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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/helpdesk")
@RequiredArgsConstructor
public class HelpdeskController {

    private final HelpdeskService svc;

    @Value("${app.upload.helpdesk.dir:/app/uploads/helpdesk}")
    private String helpdeskDir;

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'HELPDESK_CREATE')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String category,
            @RequestParam(required = false) String preferredDatetime,
            @RequestParam(required = false) List<MultipartFile> photos,
            Authentication auth) throws Exception {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "Request raised",
            svc.createRequest(title, description, category, preferredDatetime, photos, auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'HELPDESK_VIEW_OWN')")
    @GetMapping("/my")
    public ResponseEntity<?> myRequests(Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "OK", svc.getMyRequests(auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'HELPDESK_CREATE')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "Cancelled",
            svc.cancelRequest(id, auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'HELPDESK_MANAGE')")
    @GetMapping("/all")
    public ResponseEntity<?> all() {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "OK", svc.getAllRequests()));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'HELPDESK_MANAGE')")
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard() {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK", svc.getFmDashboard()));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'HELPDESK_MANAGE')")
    @GetMapping("/counts")
    public ResponseEntity<?> counts() {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK", svc.getStatusCounts()));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'HELPDESK_MANAGE')")
    @PostMapping("/{id}/assign")
    public ResponseEntity<?> assign(@PathVariable Long id,
                                     @RequestBody Map<String, String> body,
                                     Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "Assigned",
            svc.assignRequest(id, body.get("staffName"), body.get("staffContact"),
                body.get("confirmedDatetime"), body.get("fmNote"), auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'HELPDESK_MANAGE')")
    @PostMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                           @RequestBody Map<String, String> body,
                                           Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "Status updated",
            svc.updateStatus(id, body.get("status"), body.get("note"), auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'HELPDESK_VIEW_OWN') or @perm.has(authentication, 'HELPDESK_MANAGE')")
    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "OK",
            svc.getRequestDetail(id, auth.getName())));
    }

    @GetMapping("/media/photos/{filename}")
    public ResponseEntity<Resource> servePhoto(@PathVariable String filename) {
        try {
            Resource r = new FileSystemResource(Paths.get(helpdeskDir, "photos", filename).normalize());
            if (!r.exists()) return ResponseEntity.notFound().build();
            return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"").body(r);
        } catch (Exception e) { return ResponseEntity.notFound().build(); }
    }
}
