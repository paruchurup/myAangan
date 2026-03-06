package com.myaangan.entity;

import com.myaangan.enums.PassCheckInStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "visitor_pass_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VisitorPassLog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pass_id", nullable = false)
    private VisitorPass pass;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "checked_in_by_id", nullable = false)
    private User checkedInBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private PassCheckInStatus checkInStatus = PassCheckInStatus.CHECKED_IN;

    /** Populated when guard overrides an invalid pass. */
    @Column(length = 300)
    private String overrideReason;

    @CreationTimestamp
    private LocalDateTime checkedInAt;
}
