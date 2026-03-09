package com.myaangan.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

import java.io.FileInputStream;
import java.io.InputStream;

@Slf4j
@Configuration
public class FcmConfig {

    @Value("${firebase.service-account-path:}")
    private String serviceAccountPath;

    @Value("${firebase.project-id:}")
    private String projectId;

    @PostConstruct
    public void init() {
        if (serviceAccountPath == null || serviceAccountPath.isBlank()) {
            log.warn("FCM not configured — firebase.service-account-path is not set. Push notifications will be skipped.");
            return;
        }
        try {
            InputStream serviceAccount = new FileInputStream(serviceAccountPath);
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .setProjectId(projectId)
                .build();
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                log.info("Firebase FCM initialised for project: {}", projectId);
            }
        } catch (Exception e) {
            log.warn("FCM initialisation failed: {}. Push notifications will be skipped.", e.getMessage());
        }
    }

    public boolean isConfigured() {
        return !FirebaseApp.getApps().isEmpty();
    }
}
