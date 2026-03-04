package com.myaangan.entity;

import com.myaangan.enums.NoticePriority;
import com.myaangan.enums.NoticeStatus;
import com.myaangan.enums.NoticeType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "notices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notice {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 5000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoticeType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private NoticePriority priority = NoticePriority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private NoticeStatus status = NoticeStatus.DRAFT;

    // Pinned notices always appear at top regardless of date
    @Column(nullable = false)
    @Builder.Default
    private boolean pinned = false;

    // Residents must tap "I Acknowledge" — tracked via NoticeRead
    @Column(nullable = false)
    @Builder.Default
    private boolean requiresAcknowledgement = false;

    // Target audience: null = everyone, comma-separated blocks e.g. "A,B"
    @Column(length = 200)
    private String targetBlocks;

    // Scheduling
    private LocalDateTime publishAt;   // null = manual publish
    private LocalDateTime expiresAt;   // auto-archive after this date

    // Attachments (stored paths)
    @OneToMany(mappedBy = "notice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("uploadedAt ASC")
    @Builder.Default
    private List<NoticeAttachment> attachments = new ArrayList<>();

    // Read receipts
    @OneToMany(mappedBy = "notice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<NoticeRead> reads = new ArrayList<>();

    // Comments
    @OneToMany(mappedBy = "notice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<NoticeComment> comments = new ArrayList<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;
    private LocalDateTime archivedAt;
}
