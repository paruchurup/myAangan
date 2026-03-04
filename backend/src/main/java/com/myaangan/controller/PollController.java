package com.myaangan.controller;

import com.myaangan.dto.*;
import com.myaangan.service.PollService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/polls")
@RequiredArgsConstructor
public class PollController {

    private final PollService pollSvc;

    // ── Public / voter endpoints ──────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_VIEW')")
    public ResponseEntity<UserDto.ApiResponse<List<PollResponse>>> getActive(
            @AuthenticationPrincipal UserDetails user) {
        return ok("OK", pollSvc.getActivePolls(user.getUsername()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<List<PollResponse>>> getAll(
            @AuthenticationPrincipal UserDetails user) {
        return ok("OK", pollSvc.getAllPolls(user.getUsername()));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_VIEW')")
    public ResponseEntity<UserDto.ApiResponse<Map<String, Object>>> stats(
            @AuthenticationPrincipal UserDetails user) {
        return ok("OK", pollSvc.getDashboardStats(user.getUsername()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_VIEW')")
    public ResponseEntity<UserDto.ApiResponse<PollResponse>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ok("OK", pollSvc.getById(id, user.getUsername()));
    }

    @PostMapping("/{id}/vote")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_VOTE')")
    public ResponseEntity<UserDto.ApiResponse<PollResponse>> vote(
            @PathVariable Long id,
            @RequestBody PollVoteRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Vote cast", pollSvc.vote(id, req, user.getUsername()));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_VIEW')")
    public ResponseEntity<UserDto.ApiResponse<PollResponse.CommentResponse>> comment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Comment added", pollSvc.addComment(id, body.get("text"), user.getUsername()));
    }

    @DeleteMapping("/comments/{commentId}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_VIEW')")
    public ResponseEntity<UserDto.ApiResponse<Void>> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetails user) {
        pollSvc.deleteComment(commentId, user.getUsername());
        return ok("Deleted", null);
    }

    // ── Management endpoints (creator / admin) ────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<PollResponse>> create(
            @Valid @RequestBody PollRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Poll created", pollSvc.create(req, user.getUsername()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<PollResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody PollRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Poll updated", pollSvc.update(id, req, user.getUsername()));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<PollResponse>> publish(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Poll published", pollSvc.publish(id, user.getUsername()));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<PollResponse>> close(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Poll closed", pollSvc.close(id, user.getUsername()));
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<PollResponse>> archive(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return ok("Poll archived", pollSvc.archive(id, user.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'POLL_MANAGE')")
    public ResponseEntity<UserDto.ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        pollSvc.delete(id, user.getUsername());
        return ok("Poll deleted", null);
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private <T> ResponseEntity<UserDto.ApiResponse<T>> ok(String msg, T data) {
        return ResponseEntity.ok(UserDto.ApiResponse.success(msg, data));
    }
}
