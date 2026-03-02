package com.myaangan.entity;

import com.myaangan.enums.AttachmentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "complaint_attachments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ComplaintAttachment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;

    @Column(nullable = false)
    private String filename;       // stored filename (UUID-based)

    @Column(nullable = false)
    private String originalName;   // original filename from user

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttachmentType type;

    private Long fileSize;         // bytes
    private String mimeType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uploaded_by_id")
    private User uploadedBy;

    @CreationTimestamp
    private LocalDateTime uploadedAt;
}
