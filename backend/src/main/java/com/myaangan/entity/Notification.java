package com.myaangan.entity;

import com.myaangan.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "notifications",
    indexes = {
        @Index(columnList = "user_id, is_read"),
        @Index(columnList = "created_at")
    })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(nullable = false, length = 200) private String title;
    @Column(nullable = false, length = 400) private String body;

    /** Deep-link: entity type + id (e.g. "COMPLAINT:42") */
    @Column(length = 60) private String entityRef;

    @Column(nullable = false) @Builder.Default private Boolean isRead = false;

    @CreationTimestamp private LocalDateTime createdAt;
}
