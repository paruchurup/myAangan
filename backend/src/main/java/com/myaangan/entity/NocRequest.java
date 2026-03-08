package com.myaangan.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.myaangan.enums.NocRequestStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "noc_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NocRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "resident_id", nullable = false)
    private User resident;

    @Column(nullable = false, length = 200) private String purpose;
    @Column(columnDefinition = "TEXT")      private String details;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 12)
    @Builder.Default private NocRequestStatus status = NocRequestStatus.PENDING;

    /** Admin rejection reason */
    @Column(columnDefinition = "TEXT") private String rejectionReason;

    /** The fulfilled document, if uploaded */
    @JsonIgnore
    @OneToOne(mappedBy = "nocRequest", fetch = FetchType.LAZY)
    private VaultDocument fulfilledDocument;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "handled_by_id") private User handledBy;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
}
