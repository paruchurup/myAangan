package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "event_photos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventPhoto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name = "event_id",     nullable = false) private Event event;
    @ManyToOne @JoinColumn(name = "uploaded_by_id", nullable = false) private User uploadedBy;
    @Column(nullable = false, length = 300) private String photoPath;
    @Column(length = 200) private String caption;
    @CreationTimestamp private LocalDateTime uploadedAt;
}
