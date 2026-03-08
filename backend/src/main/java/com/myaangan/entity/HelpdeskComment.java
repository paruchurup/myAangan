package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "helpdesk_comments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HelpdeskComment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private HelpdeskRequest request;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    /** true = FM/staff note, false = resident comment */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isStaffNote = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
