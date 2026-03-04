package com.myaangan.controller;

import com.myaangan.dto.*;
import com.myaangan.service.NoticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService svc;

    // ── Resident / viewer endpoints ───────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_VIEW')")
    public ResponseEntity<UserDto.ApiResponse<List<NoticeResponse>>> getPublished(
            @AuthenticationPrincipal UserDetails user) {
        return ok("OK", svc.getPublished(user.getUsername()));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_VIEW')")
    public ResponseEntity<UserDto.ApiResponse<Map<String, Long>>> unreadCount(
            @AuthenticationPrincipal UserDetails user) {
        return ok("OK", Map.of("count", svc.getUnreadCount(user.getUsername())));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_VIEW')")
    public ResponseEntity<UserDto.ApiResponse<NoticeResponse>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ok("OK", svc.getById(id, user.getUsername()));
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_VIEW')")
    public ResponseEntity<UserDto.ApiResponse<NoticeResponse>> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Marked as read", svc.markRead(id, user.getUsername()));
    }

    @PostMapping("/{id}/acknowledge")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_VIEW')")
    public ResponseEntity<UserDto.ApiResponse<NoticeResponse>> acknowledge(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Acknowledged", svc.acknowledge(id, user.getUsername()));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_VIEW')")
    public ResponseEntity<UserDto.ApiResponse<NoticeResponse.CommentInfo>> comment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Comment added", svc.addComment(id, body.get("text"), user.getUsername()));
    }

    @DeleteMapping("/comments/{commentId}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_VIEW')")
    public ResponseEntity<UserDto.ApiResponse<Void>> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails user) {
        svc.deleteComment(commentId, user.getUsername());
        return ok("Deleted", null);
    }

    // ── Attachment download ───────────────────────────────────────────────────

    @GetMapping("/attachments/{id}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_VIEW')")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) {
        // Attachment download — served directly from disk
        // In production, serve via nginx; this is a fallback
        return ResponseEntity.notFound().build(); // placeholder — extend if needed
    }

    // ── Management endpoints ──────────────────────────────────────────────────

    @GetMapping("/manage/all")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<List<NoticeResponse>>> getAll(
            @AuthenticationPrincipal UserDetails user) {
        return ok("OK", svc.getAllManageable(user.getUsername()));
    }

    @GetMapping("/manage/archived")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<List<NoticeResponse>>> getArchived(
            @AuthenticationPrincipal UserDetails user) {
        return ok("OK", svc.getArchived(user.getUsername()));
    }

    @GetMapping("/{id}/readers")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<List<NoticeResponse.ReaderInfo>>> getReaders(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ok("OK", svc.getReaders(id, user.getUsername()));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<NoticeResponse>> create(
            @RequestPart("data") @Valid NoticeRequest req,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails user) throws Exception {
        return ok("Notice created", svc.create(req, user.getUsername(), files));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<NoticeResponse>> update(
            @PathVariable Long id,
            @RequestPart("data") @Valid NoticeRequest req,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @AuthenticationPrincipal UserDetails user) throws Exception {
        return ok("Notice updated", svc.update(id, req, user.getUsername(), files));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<NoticeResponse>> publish(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Published", svc.publish(id, user.getUsername()));
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<NoticeResponse>> archive(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Archived", svc.archive(id, user.getUsername()));
    }

    @PostMapping("/{id}/pin")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<NoticeResponse>> togglePin(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Updated", svc.togglePin(id, user.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'NOTICE_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        svc.delete(id, user.getUsername());
        return ok("Deleted", null);
    }

    private <T> ResponseEntity<UserDto.ApiResponse<T>> ok(String msg, T data) {
        return ResponseEntity.ok(UserDto.ApiResponse.success(msg, data));
    }
}
