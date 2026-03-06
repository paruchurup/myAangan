package com.myaangan.dto;

import com.myaangan.enums.Role;
import com.myaangan.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class UserDto {

    // ─── Register Request ───────────────────────────────────────────────────────
    @Data
    public static class RegisterRequest {
        @NotBlank @Email
        private String email;

        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        @NotBlank
        private String firstName;

        @NotBlank
        private String lastName;

        private String phone;

        @NotNull
        private Role role;

        // Resident fields
        private String flatNumber;
        private String block;
        private String societyName;

        // Visitor fields
        private String hostFlatNumber;
    }

    // ─── Login Request ──────────────────────────────────────────────────────────
    @Data
    public static class LoginRequest {
        @NotBlank @Email
        private String email;

        @NotBlank
        private String password;
    }

    // ─── Auth Response ──────────────────────────────────────────────────────────
    @Data
    public static class AuthResponse {
        private String token;
        private String tokenType = "Bearer";
        private UserResponse user;

        public AuthResponse(String token, UserResponse user) {
            this.token = token;
            this.user = user;
        }
    }

    // ─── User Response ──────────────────────────────────────────────────────────
    @Data
    public static class UserResponse {
        private Long id;
        private String email;
        private String firstName;
        private String lastName;
        private String phone;
        private Role role;
        private UserStatus status;
        private String flatNumber;
        private String block;
        private String societyName;
        private String hostFlatNumber;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        // Delivery preferences (Phase 3B)
        private String deliveryNote;
        private String preferredCollector;
        private String dndStart;
        private String dndEnd;
        private String defaultCollectorName;

        // Dynamic permissions for this user's role
        private List<String> permissions;
    }

    // ─── Update Request ─────────────────────────────────────────────────────────
    @Data
    public static class UpdateRequest {
        private String firstName;
        private String lastName;
        private String phone;
        private String flatNumber;
        private String block;
        private String societyName;
        private String hostFlatNumber;
    }

    // ─── Status Update Request (Admin only) ─────────────────────────────────────
    @Data
    public static class StatusUpdateRequest {
        @NotNull
        private UserStatus status;
    }

    // ─── Change Password Request ─────────────────────────────────────────────────
    @Data
    public static class ChangePasswordRequest {
        @NotBlank
        private String currentPassword;

        @NotBlank @Size(min = 6)
        private String newPassword;
    }

    // ─── Forgot Password Request ─────────────────────────────────────────────────
    @Data
    public static class ForgotPasswordRequest {
        @NotBlank @Email
        private String email;
    }

    // ─── Reset Password Request ──────────────────────────────────────────────────
    @Data
    public static class ResetPasswordRequest {
        @NotBlank
        private String token;

        @NotBlank @Size(min = 6)
        private String newPassword;
    }

    // ─── API Response Wrapper ────────────────────────────────────────────────────
    @Data
    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;

        public static <T> ApiResponse<T> success(String message, T data) {
            ApiResponse<T> response = new ApiResponse<>();
            response.success = true;
            response.message = message;
            response.data = data;
            return response;
        }

        public static <T> ApiResponse<T> error(String message) {
            ApiResponse<T> response = new ApiResponse<>();
            response.success = false;
            response.message = message;
            return response;
        }
    }
}
