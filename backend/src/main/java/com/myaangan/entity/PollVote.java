package com.myaangan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "poll_votes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"poll_id", "voter_id", "option_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PollVote {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id", nullable = false)
    private Poll poll;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "voter_id", nullable = false)
    private User voter;

    // For SINGLE/MULTIPLE choice — points to a PollOption
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "option_id")
    private PollOption option;

    // For YES_NO: "YES", "NO", "ABSTAIN"
    @Column(length = 10)
    private String yesNoValue;

    // For RATING: 1–5
    private Integer ratingValue;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
}
