package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "notice_attachments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NoticeAttachment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id", nullable = false)
    private Notice notice;

    @Column(nullable = false)
    private String originalName;   // original filename

    @Column(nullable = false)
    private String storedPath;     // path on disk

    @Column(nullable = false, length = 10)
    private String fileType;       // "IMAGE" | "PDF" | "DOCUMENT"

    private long fileSize;         // bytes

    @CreationTimestamp
    private LocalDateTime uploadedAt;
}
