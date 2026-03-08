package com.myaangan.entity;

import com.myaangan.enums.DocumentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "vault_documents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VaultDocument {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 15)
    private DocumentType type;

    @Column(nullable = false, length = 200) private String title;
    @Column(columnDefinition = "TEXT")      private String description;
    @Column(nullable = false, length = 300) private String filePath;
    @Column(nullable = false, length = 20)  private String fileFormat; // PDF, JPG, PNG, DOCX

    /** For NOC docs — linked to a specific resident */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "resident_id") private User resident;

    /** For NOC docs — linked to the original request */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "noc_request_id") private NocRequest nocRequest;

    /** Who uploaded this document */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "uploaded_by_id") private User uploadedBy;

    /** Optional expiry date */
    private LocalDate expiryDate;

    @Column(nullable = false) @Builder.Default private Boolean active = true;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
}
