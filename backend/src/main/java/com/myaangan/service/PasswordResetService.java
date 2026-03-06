package com.myaangan.service;

import com.myaangan.entity.User;
import com.myaangan.exception.ResourceNotFoundException;
import com.myaangan.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired(required = false) private JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}") private boolean mailEnabled;
    @Value("${app.mail.from:noreply@myaangan.com}") private String mailFrom;
    @Value("${app.url:http://localhost:4200}") private String appUrl;

    public void initiateForgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with that email"));

        String token = UUID.randomUUID().toString();
        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        String resetUrl = appUrl + "/auth/reset-password?token=" + token;

        if (mailEnabled && mailSender != null) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(mailFrom);
                msg.setTo(email);
                msg.setSubject("MyAangan – Password Reset");
                msg.setText(
                    "Hi " + user.getFirstName() + ",\n\n" +
                    "Click the link below to reset your password. It expires in 1 hour.\n\n" +
                    resetUrl + "\n\n" +
                    "If you didn't request this, ignore this email.\n\n" +
                    "– MyAangan Team"
                );
                mailSender.send(msg);
                logger.info("Password reset email sent to {}", email);
            } catch (Exception e) {
                logger.error("Failed to send reset email to {}: {}", email, e.getMessage());
                logger.info("Reset URL (dev fallback): {}", resetUrl);
            }
        } else {
            logger.info("Mail not enabled. Reset URL for {}: {}", email, resetUrl);
        }
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset link"));

        if (user.getPasswordResetTokenExpiry() == null ||
                user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset link has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        userRepository.save(user);
        logger.info("Password reset successfully for {}", user.getEmail());
    }
}
