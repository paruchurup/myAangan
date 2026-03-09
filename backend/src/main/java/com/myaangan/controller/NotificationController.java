package com.myaangan.controller;

import com.myaangan.dto.UserDto;
import com.myaangan.dto.UserDto.ApiResponse;
import com.myaangan.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService svc;

    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseEntity<?> list(@RequestParam(defaultValue = "0") int page, Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success( "OK", svc.getNotifications(auth.getName(), page)));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success(  "OK",
            Map.of("unreadCount", svc.getUnreadCount(auth.getName()))));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication auth) {
        svc.markRead(id, auth.getName());
        return ResponseEntity.ok(UserDto.ApiResponse.success(  "Marked read", null));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication auth) {
        int n = svc.markAllRead(auth.getName());
        return ResponseEntity.ok(UserDto.ApiResponse.success(  n + " notifications marked read", null));
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/fcm-token")
    public ResponseEntity<?> registerToken(@RequestBody Map<String, String> body, Authentication auth) {
        String token = body.get("token");
        if (token == null || token.isBlank())
            return ResponseEntity.badRequest().body(UserDto.ApiResponse.success( "Token required", null));
        svc.registerToken(auth.getName(), token);
        return ResponseEntity.ok(UserDto.ApiResponse.success(  "Token registered", null));
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/fcm-token")
    public ResponseEntity<?> removeToken(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token != null) svc.removeToken(token);
        return ResponseEntity.ok(UserDto.ApiResponse.success( "Token removed", null));
    }
}
