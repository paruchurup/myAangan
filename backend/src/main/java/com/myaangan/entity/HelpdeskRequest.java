package com.myaangan.entity;

import com.myaangan.enums.HelpdeskCategory;
import com.myaangan.enums.HelpdeskStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity @Table(name = "helpdesk_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HelpdeskRequest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private HelpdeskCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private HelpdeskStatus status = HelpdeskStatus.PENDING;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "raised_by_id", nullable = false)
    private User raisedBy;

    /** Resident's suggested preferred date/time for the work. */
    private LocalDateTime preferredAt;

    /** FM-confirmed scheduled date/time. */
    private LocalDateTime confirmedAt;

    /** Name of staff member assigned by FM. */
    @Column(length = 150)
    private String assignedStaff;

    /** Internal FM note on assignment. */
    @Column(columnDefinition = "TEXT")
    private String assignmentNote;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<HelpdeskPhoto> photos;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<HelpdeskComment> comments;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
}
