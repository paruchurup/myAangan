package com.myaangan.service;

import com.myaangan.dto.UserDto;
import com.myaangan.dto.DeliveryPreferencesRequest;
import com.myaangan.dto.DeliveryPreferencesResponse;
import com.myaangan.entity.User;
import com.myaangan.enums.Role;
import com.myaangan.enums.UserStatus;
import com.myaangan.exception.ResourceNotFoundException;
import com.myaangan.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ─── Register ────────────────────────────────────────────────────────────────
    public UserDto.UserResponse register(UserDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered: " + request.getEmail());
        }
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Phone number is already registered");
        }

        // Admin and Security Guard get auto-approved; residents/visitors need approval
        UserStatus initialStatus = (request.getRole() == Role.ADMIN || request.getRole() == Role.SECURITY_GUARD)
                ? UserStatus.ACTIVE
                : UserStatus.PENDING_APPROVAL;

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(request.getRole())
                .status(initialStatus)
                .flatNumber(request.getFlatNumber())
                .block(request.getBlock())
                .societyName(request.getSocietyName())
                .hostFlatNumber(request.getHostFlatNumber())
                .build();

        User saved = userRepository.save(user);
        return mapToResponse(saved);
    }

    // ─── Get user by email ───────────────────────────────────────────────────────
    public UserDto.UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return mapToResponse(user);
    }

    // ─── Get user by ID ──────────────────────────────────────────────────────────
    public UserDto.UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        return mapToResponse(user);
    }

    // ─── Get all users (Admin) ───────────────────────────────────────────────────
    public List<UserDto.UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─── Get users by role (Admin) ───────────────────────────────────────────────
    public List<UserDto.UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─── Get pending approvals (Admin) ───────────────────────────────────────────
    public List<UserDto.UserResponse> getPendingUsers() {
        return userRepository.findByStatus(UserStatus.PENDING_APPROVAL).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─── Update profile ──────────────────────────────────────────────────────────
    public UserDto.UserResponse updateUser(Long id, UserDto.UpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getFlatNumber() != null) user.setFlatNumber(request.getFlatNumber());
        if (request.getBlock() != null) user.setBlock(request.getBlock());
        if (request.getSocietyName() != null) user.setSocietyName(request.getSocietyName());
        if (request.getHostFlatNumber() != null) user.setHostFlatNumber(request.getHostFlatNumber());

        return mapToResponse(userRepository.save(user));
    }

    // ─── Update status (Admin only) ──────────────────────────────────────────────
    public UserDto.UserResponse updateUserStatus(Long id, UserStatus status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        user.setStatus(status);
        return mapToResponse(userRepository.save(user));
    }

    // ─── Change password ─────────────────────────────────────────────────────────
    public void changePassword(String email, UserDto.ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ─── Delivery Preferences (Phase 3B) ────────────────────────────────────────
    public DeliveryPreferencesResponse getDeliveryPreferences(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return DeliveryPreferencesResponse.from(user);
    }

    public DeliveryPreferencesResponse updateDeliveryPreferences(String email,
                                                                  DeliveryPreferencesRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        // Allow explicit null to clear fields
        user.setDeliveryNote(req.getDeliveryNote());
        user.setPreferredCollector(req.getPreferredCollector());
        user.setDndStart(req.getDndStart());
        user.setDndEnd(req.getDndEnd());
        user.setDefaultCollectorName(req.getDefaultCollectorName());

        userRepository.save(user);
        return DeliveryPreferencesResponse.from(user);
    }

    // ─── Delete user (Admin only) ────────────────────────────────────────────────
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        user.setEnabled(false);  // Soft delete
        userRepository.save(user);
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────────
    public UserDto.UserResponse mapToResponse(User user) {
        UserDto.UserResponse response = new UserDto.UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole());
        response.setStatus(user.getStatus());
        response.setFlatNumber(user.getFlatNumber());
        response.setBlock(user.getBlock());
        response.setSocietyName(user.getSocietyName());
        response.setHostFlatNumber(user.getHostFlatNumber());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        // Delivery preferences
        response.setDeliveryNote(user.getDeliveryNote());
        response.setPreferredCollector(user.getPreferredCollector());
        response.setDndStart(user.getDndStart());
        response.setDndEnd(user.getDndEnd());
        response.setDefaultCollectorName(user.getDefaultCollectorName());
        return response;
    }
}
