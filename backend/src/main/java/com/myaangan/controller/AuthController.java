package com.myaangan.controller;

import com.myaangan.dto.UserDto;
import com.myaangan.security.JwtUtils;
import com.myaangan.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserService userService;

    /**
     * POST /api/auth/register
     * Registers a new user. Residents and Visitors will have PENDING_APPROVAL status.
     */
    @PostMapping("/register")
    public ResponseEntity<UserDto.ApiResponse<UserDto.UserResponse>> register(
            @Valid @RequestBody UserDto.RegisterRequest request) {
        UserDto.UserResponse user = userService.register(request);
        return ResponseEntity.ok(UserDto.ApiResponse.success("Registration successful", user));
    }

    /**
     * POST /api/auth/login
     * Returns JWT token on successful login.
     */
    @PostMapping("/login")
    public ResponseEntity<UserDto.ApiResponse<UserDto.AuthResponse>> login(
            @Valid @RequestBody UserDto.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateToken(authentication);
        UserDto.UserResponse userResponse = userService.getUserByEmail(request.getEmail());

        return ResponseEntity.ok(UserDto.ApiResponse.success("Login successful",
                new UserDto.AuthResponse(jwt, userResponse)));
    }
}
