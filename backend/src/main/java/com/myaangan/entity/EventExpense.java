package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "event_expenses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventExpense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name = "event_id",      nullable = false) private Event event;
    @ManyToOne @JoinColumn(name = "logged_by_id",  nullable = false) private User loggedBy;
    @Column(nullable = false, length = 200) private String description;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal amount;
    @Column(length = 80) private String category;   // Food, Decoration, Music, Venue, Other
    @Column(length = 300) private String receiptPath;
    @CreationTimestamp private LocalDateTime createdAt;
}
