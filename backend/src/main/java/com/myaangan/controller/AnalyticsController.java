package com.myaangan.controller;

import com.myaangan.dto.UserDto;
import com.myaangan.dto.UserDto.ApiResponse;
import com.myaangan.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService svc;

    @PreAuthorize("hasRole('ADMIN') or @perm.has(authentication, 'ANALYTICS_VIEW')")
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK", svc.getSummary()));
    }
}
