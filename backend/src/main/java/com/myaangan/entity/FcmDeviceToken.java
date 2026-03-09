package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "fcm_device_tokens",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "token"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FcmDeviceToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500) private String token;

    @UpdateTimestamp private LocalDateTime updatedAt;
}
