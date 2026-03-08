package com.myaangan.entity;

import com.myaangan.enums.EventVoteChoice;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "event_votes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "voter_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventVote {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name = "event_id", nullable = false) private Event event;
    @ManyToOne @JoinColumn(name = "voter_id", nullable = false) private User voter;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 5) private EventVoteChoice choice;
    @CreationTimestamp private LocalDateTime votedAt;
}
