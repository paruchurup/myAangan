package com.myaangan.controller;

import com.myaangan.dto.DeliveryPreferencesRequest;
import com.myaangan.dto.DeliveryPreferencesResponse;
import com.myaangan.dto.UserDto;
import com.myaangan.enums.Role;
import com.myaangan.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserService userService;

    // ─── Current User ─────────────────────────────────────────────────────────

    /**
     * GET /api/users/me — Get current logged-in user profile
     */
    @GetMapping("/users/me")
    public ResponseEntity<UserDto.ApiResponse<UserDto.UserResponse>> getCurrentUser(Authentication auth) {
        UserDto.UserResponse user = userService.getUserByEmail(auth.getName());
        return ResponseEntity.ok(UserDto.ApiResponse.success("User profile", user));
    }

    /**
     * PUT /api/users/me — Update current user's profile
     */
    @PutMapping("/users/me")
    public ResponseEntity<UserDto.ApiResponse<UserDto.UserResponse>> updateCurrentUser(
            Authentication auth,
            @Valid @RequestBody UserDto.UpdateRequest request) {
        UserDto.UserResponse current = userService.getUserByEmail(auth.getName());
        UserDto.UserResponse updated = userService.updateUser(current.getId(), request);
        return ResponseEntity.ok(UserDto.ApiResponse.success("Profile updated", updated));
    }

    /**
     * POST /api/users/me/change-password — Change password
     */
    @PostMapping("/users/me/change-password")
    public ResponseEntity<UserDto.ApiResponse<Void>> changePassword(
            Authentication auth,
            @Valid @RequestBody UserDto.ChangePasswordRequest request) {
        userService.changePassword(auth.getName(), request);
        return ResponseEntity.ok(UserDto.ApiResponse.success("Password changed successfully", null));
    }

    // ─── Admin Endpoints ──────────────────────────────────────────────────────

    /**
     * GET /api/admin/users — List all users (Admin only)
     */
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<List<UserDto.UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(UserDto.ApiResponse.success("All users", userService.getAllUsers()));
    }

    /**
     * GET /api/admin/users/{id} — Get user by ID (Admin only)
     */
    @GetMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<UserDto.UserResponse>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("User found", userService.getUserById(id)));
    }

    /**
     * GET /api/admin/users/pending — Get users pending approval (Admin only)
     */
    @GetMapping("/admin/users/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<List<UserDto.UserResponse>>> getPendingUsers() {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Pending users", userService.getPendingUsers()));
    }

    /**
     * GET /api/admin/users/role/{role} — Get users by role (Admin only)
     */
    @GetMapping("/admin/users/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<List<UserDto.UserResponse>>> getUsersByRole(
            @PathVariable Role role) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Users by role", userService.getUsersByRole(role)));
    }

    /**
     * PUT /api/admin/users/{id} — Update any user's profile (Admin only)
     */
    @PutMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<UserDto.UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserDto.UpdateRequest request) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("User updated", userService.updateUser(id, request)));
    }

    /**
     * PATCH /api/admin/users/{id}/status — Approve/activate/deactivate user (Admin only)
     */
    @PatchMapping("/admin/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<UserDto.UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserDto.StatusUpdateRequest request) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("User status updated",
                userService.updateUserStatus(id, request.getStatus())));
    }

    /**
     * DELETE /api/admin/users/{id} — Soft delete user (Admin only)
     */
    @DeleteMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto.ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(UserDto.ApiResponse.success("User deleted", null));
    }

    /**
     * GET /api/users/me/delivery-preferences — Get my delivery preferences
     */
    @GetMapping("/users/me/delivery-preferences")
    public ResponseEntity<UserDto.ApiResponse<DeliveryPreferencesResponse>> getDeliveryPreferences(
            Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("OK",
            userService.getDeliveryPreferences(auth.getName())));
    }

    /**
     * PUT /api/users/me/delivery-preferences — Save my delivery preferences
     */
    @PutMapping("/users/me/delivery-preferences")
    public ResponseEntity<UserDto.ApiResponse<DeliveryPreferencesResponse>> updateDeliveryPreferences(
            @Valid @RequestBody DeliveryPreferencesRequest req,
            Authentication auth) {
        return ResponseEntity.ok(UserDto.ApiResponse.success("Preferences saved",
            userService.updateDeliveryPreferences(auth.getName(), req)));
    }
}
