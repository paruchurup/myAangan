package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "helpdesk_photos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HelpdeskPhoto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private HelpdeskRequest request;

    @Column(nullable = false, length = 300)
    private String photoPath;

    @CreationTimestamp
    private LocalDateTime uploadedAt;
}
