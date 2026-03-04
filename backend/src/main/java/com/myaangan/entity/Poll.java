package com.myaangan.entity;

import com.myaangan.enums.PollStatus;
import com.myaangan.enums.PollType;
import com.myaangan.enums.ResultVisibility;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "polls")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Poll {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String question;

    @Column(length = 1000)
    private String description; // optional context / background

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PollType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PollStatus status = PollStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ResultVisibility resultVisibility = ResultVisibility.AFTER_VOTE;

    // Scheduling
    private LocalDateTime startsAt;   // null = manual activation
    private LocalDateTime endsAt;     // null = manual close

    // Options — only for SINGLE_CHOICE / MULTIPLE_CHOICE
    @OneToMany(mappedBy = "poll", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<PollOption> options = new ArrayList<>();

    // Votes cast
    @OneToMany(mappedBy = "poll", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PollVote> votes = new ArrayList<>();

    // Comments
    @OneToMany(mappedBy = "poll", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<PollComment> comments = new ArrayList<>();

    // Settings
    @Column(nullable = false)
    @Builder.Default
    private boolean anonymous = false; // hide voter names from results

    @Column(nullable = false)
    @Builder.Default
    private boolean allowVoteChange = true; // resident can change vote before close

    @Column(nullable = false)
    @Builder.Default
    private boolean allowComments = true;

    // For MULTIPLE_CHOICE: max options a voter can select (0 = unlimited)
    @Builder.Default
    private int maxChoices = 0;

    // Target audience: null = everyone, or comma-separated blocks e.g. "A,B"
    @Column(length = 200)
    private String targetBlocks;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp  private LocalDateTime updatedAt;
    private LocalDateTime closedAt;
    private LocalDateTime publishedAt;
}
