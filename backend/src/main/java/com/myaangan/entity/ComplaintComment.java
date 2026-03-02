package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "complaint_comments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ComplaintComment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @Column(nullable = false, length = 2000)
    private String text;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    // Internal notes hidden from resident/guard — visible only to FM/BM/BDA/Admin
    @Column(nullable = false)
    @Builder.Default
    private boolean internal = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
