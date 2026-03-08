package com.myaangan.controller;

import com.myaangan.dto.UserDto;
import com.myaangan.dto.UserDto.ApiResponse;
import com.myaangan.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.math.BigDecimal;
import java.nio.file.Paths;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService svc;

    @Value("${app.upload.events.dir:/app/uploads/events}")
    private String eventsDir;

    // ── Phase 1: Event CRUD ───────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_CREATE')")
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> req, Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Event created", svc.createEvent(req, auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_VIEW')")
    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "OK", svc.getActiveEvents()));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_CREATE')")
    @GetMapping("/all")
    public ResponseEntity<?> listAll() {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "OK", svc.getAllEvents()));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_VIEW')")
    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success(  "OK", svc.getEventDetail(id, auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_CREATE')")
    @PostMapping("/{id}/open-voting")
    public ResponseEntity<?> openVoting(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success(  "Voting opened", svc.openVoting(id, auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_CREATE')")
    @PostMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "Event activated", svc.activateEvent(id, auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_CREATE')")
    @PostMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "Event completed", svc.completeEvent(id, auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_CREATE')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success(  "Event cancelled", svc.cancelEvent(id, auth.getName())));
    }

    // ── Phase 1: Approval voting ──────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_VOTE')")
    @PostMapping("/{id}/vote")
    public ResponseEntity<?> vote(@PathVariable Long id,
                                   @RequestBody Map<String, String> body,
                                   Authentication auth) {
        svc.castApprovalVote(id, body.get("choice"), auth.getName());
        return ResponseEntity.ok(UserDto.ApiResponse.success(  "Vote cast", null));
    }

    // ── Phase 1: Volunteer slots ──────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_VOLUNTEER')")
    @PostMapping("/slots/{slotId}/signup")
    public ResponseEntity<?> signup(@PathVariable Long slotId, Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "Signed up", svc.signUpVolunteer(slotId, auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_VOLUNTEER')")
    @DeleteMapping("/slots/{slotId}/signup")
    public ResponseEntity<?> withdraw(@PathVariable Long slotId, Authentication auth) {
        svc.withdrawVolunteer(slotId, auth.getName());
        return ResponseEntity.ok(UserDto.ApiResponse.success(  "Withdrawn", null));
    }

    // ── Phase 1: Recognition ──────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_CREATE')")
    @PutMapping("/{id}/recognition")
    public ResponseEntity<?> saveRecognition(@PathVariable Long id,
                                              @RequestBody Map<String, String> body,
                                              Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success(  "Recognition saved",
            svc.saveRecognition(id, body.get("recognitionJson"), auth.getName())));
    }

    // ── Phase 2: Contributions ────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_CONTRIBUTE')")
    @PostMapping("/{id}/contribute")
    public ResponseEntity<?> contribute(@PathVariable Long id,
                                         @RequestBody Map<String, Object> body,
                                         Authentication auth) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        return ResponseEntity.ok(UserDto.ApiResponse.success(  "Order created",
            svc.createContributionOrder(id, amount, auth.getName())));
    }

    @PostMapping("/webhook/razorpay")
    public ResponseEntity<?> webhook(@RequestBody String payload,
                                      @RequestHeader(value = "X-Razorpay-Signature", required = false) String sig) {
        try { svc.handleContributionWebhook(payload, sig != null ? sig : ""); }
        catch (Exception e) { log.error("Event webhook error: {}", e.getMessage()); }
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_CONTRIBUTE')")
    @PostMapping("/{id}/inkind")
    public ResponseEntity<?> logInKind(@PathVariable Long id,
                                        @RequestBody Map<String, Object> body,
                                        Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "In-kind contribution logged",
            svc.logInKind(id, body, auth.getName())));
    }

    // ── Phase 3: Expenses ─────────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_EXPENSE')")
    @PostMapping(value = "/{id}/expenses", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> logExpense(@PathVariable Long id,
                                         @RequestParam String description,
                                         @RequestParam BigDecimal amount,
                                         @RequestParam(defaultValue = "Other") String category,
                                         @RequestParam(required = false) MultipartFile receipt,
                                         Authentication auth) throws Exception {
        return ResponseEntity.ok(UserDto.ApiResponse.success(  "Expense logged",
            svc.logExpense(id, description, amount, category, receipt, auth.getName())));
    }

    // ── Phase 4: Balance sheet & surplus voting ───────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_VIEW')")
    @GetMapping("/{id}/balance-sheet")
    public ResponseEntity<?> balanceSheet(@PathVariable Long id) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "OK", svc.getBalanceSheet(id)));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_VOTE')")
    @PostMapping("/{id}/surplus-vote")
    public ResponseEntity<?> surplusVote(@PathVariable Long id,
                                          @RequestBody Map<String, String> body,
                                          Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "Surplus vote cast",
            svc.castSurplusVote(id, body.get("choice"), auth.getName())));
    }

    // ── Phase 4: Photos ───────────────────────────────────────────────────

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_PHOTO')")
    @PostMapping(value = "/{id}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPhoto(@PathVariable Long id,
                                          @RequestParam MultipartFile photo,
                                          @RequestParam(required = false) String caption,
                                          Authentication auth) throws Exception {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "Photo uploaded",
            svc.uploadPhoto(id, photo, caption, auth.getName())));
    }

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'EVENT_VIEW')")
    @GetMapping("/{id}/photos")
    public ResponseEntity<?> getPhotos(@PathVariable Long id) {
        return ResponseEntity.ok(UserDto.ApiResponse.success(  "OK", svc.getPhotos(id)));
    }

    // ── Static file serving ───────────────────────────────────────────────

    @GetMapping("/media/{type}/{filename}")
    public ResponseEntity<Resource> serveFile(@PathVariable String type,
                                               @PathVariable String filename) {
        try {
            var path = Paths.get(eventsDir, type, filename).normalize();
            Resource r = new FileSystemResource(path);
            if (!r.exists()) return ResponseEntity.notFound().build();
            MediaType mt = filename.endsWith(".pdf") ? MediaType.APPLICATION_PDF : MediaType.IMAGE_JPEG;
            return ResponseEntity.ok().contentType(mt)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(r);
        } catch (Exception e) { return ResponseEntity.notFound().build(); }
    }
}
