package com.myaangan.entity;

import com.myaangan.enums.ContributionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "event_contributions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventContribution {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name = "event_id",    nullable = false) private Event event;
    @ManyToOne @JoinColumn(name = "resident_id", nullable = false) private User resident;
    @Column(nullable = false, precision = 10, scale = 2) private BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private ContributionType type;
    @Column(length = 100) private String razorpayOrderId;
    @Column(length = 100) private String razorpayPaymentId;
    @Column(length = 200) private String note;
    @Column(nullable = false) @Builder.Default private Boolean confirmed = false;
    @CreationTimestamp private LocalDateTime createdAt;
}
