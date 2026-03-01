package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "service_providers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceProvider {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    private String area;

    // Phase 2B: photo stored as filename, served via /uploads/photos/<filename>
    private String photoFilename;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private ServiceCategory category;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "added_by_user_id", nullable = false)
    private User addedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Availability availability = Availability.AVAILABLE;

    @Column(nullable = false) @Builder.Default
    private double avgRating = 0.0;

    @Column(nullable = false) @Builder.Default
    private int reviewCount = 0;

    @Column(nullable = false) @Builder.Default
    private boolean active = true;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "provider", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ServiceReview> reviews;

    public enum Availability { AVAILABLE, BUSY, NOT_RESPONDING }
}
