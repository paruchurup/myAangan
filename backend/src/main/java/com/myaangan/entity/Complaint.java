package com.myaangan.entity;

import com.myaangan.enums.ComplaintCategory;
import com.myaangan.enums.ComplaintStatus;
import com.myaangan.enums.EscalationLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.OrderBy;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "complaints")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Complaint {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ComplaintStatus status = ComplaintStatus.OPEN;

    // Escalation
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EscalationLevel escalationLevel = EscalationLevel.FACILITY_MANAGER;

    // SLA deadline for current escalation level — auto-escalate if breached
    private LocalDateTime slaDueAt;

    // Who raised it
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "raised_by_id", nullable = false)
    private User raisedBy;

    // Flat/location reference
    private String flatNumber;
    private String block;
    private String locationDescription; // e.g. "Building A entrance"

    // Assigned FM
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    // Rejection reason
    @Column(length = 500)
    private String rejectionReason;

    // Resolution note
    @Column(length = 1000)
    private String resolutionNote;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ComplaintAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<ComplaintComment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<ComplaintHistory> history = new ArrayList<>();
}
