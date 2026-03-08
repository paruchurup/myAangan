package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "event_inkind_contributions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventInKindContribution {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name = "event_id",    nullable = false) private Event event;
    @ManyToOne @JoinColumn(name = "resident_id", nullable = false) private User resident;
    @Column(nullable = false, length = 150) private String itemName;
    @Column(length = 200) private String description;
    @Column(nullable = false) private Integer quantity;
    @Column(precision = 10, scale = 2) private BigDecimal estimatedValue;
    @CreationTimestamp private LocalDateTime createdAt;
}
