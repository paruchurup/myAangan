package com.myaangan.entity;

import com.myaangan.enums.EventStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity @Table(name = "events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Event {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150) private String name;
    @Column(columnDefinition = "TEXT")      private String description;
    @Column(nullable = false)               private LocalDateTime eventDate;
    @Column(length = 200)                   private String venue;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal estimatedBudget;

    /** Quorum percentage required for approval (e.g. 50 = 50%). */
    @Column(nullable = false) private Integer quorumPct;
    /** When voting closes and result is auto-calculated. */
    @Column(nullable = false) private LocalDateTime voteDeadline;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 15)
    @Builder.Default private EventStatus status = EventStatus.DRAFT;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_id") private User createdBy;

    /** Written recognition message per volunteer — stored as JSON text */
    @Column(columnDefinition = "TEXT") private String recognitionJson;

    /** Organiser's surplus decision note */
    @Column(columnDefinition = "TEXT") private String surplusNote;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EventVolunteerSlot> volunteerSlots;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
}
