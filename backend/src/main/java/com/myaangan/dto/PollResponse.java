package com.myaangan.dto;

import com.myaangan.enums.PollStatus;
import com.myaangan.enums.PollType;
import com.myaangan.enums.ResultVisibility;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data @Builder
public class PollResponse {

    private Long id;
    private String question;
    private String description;
    private PollType type;
    private PollStatus status;
    private ResultVisibility resultVisibility;

    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private LocalDateTime closedAt;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;

    private boolean anonymous;
    private boolean allowVoteChange;
    private boolean allowComments;
    private int maxChoices;
    private String targetBlocks;

    private String createdByName;
    private String createdByRole;

    private List<OptionResponse> options;
    private List<CommentResponse> comments;

    // Participation
    private long totalVoters;   // distinct voters
    private long totalVotes;    // total vote records (> voters for multi-choice)

    // Whether the current viewer has voted
    private boolean hasVoted;
    private List<Long>   myOptionIds;
    private String       myYesNoValue;
    private Integer      myRatingValue;

    // Results — only populated when viewer is allowed to see them
    private PollResults results;

    // Is results visible to this viewer right now?
    private boolean resultsVisible;

    // Time left display
    private Long secondsRemaining; // null if no end date

    @Data @Builder
    public static class OptionResponse {
        private Long id;
        private String text;
        private String emoji;
        private int displayOrder;
        // Results (when visible)
        private long voteCount;
        private double percentage;
    }

    @Data @Builder
    public static class CommentResponse {
        private Long id;
        private String authorName;
        private String authorRole;
        private String text;
        private LocalDateTime createdAt;
        private boolean canDelete; // viewer can delete their own
    }

    @Data @Builder
    public static class PollResults {
        // For SINGLE/MULTIPLE choice
        private Map<Long, Long>   optionVoteCounts;   // optionId → count
        private Map<Long, Double> optionPercentages;  // optionId → %

        // For YES_NO
        private long yesCount;
        private long noCount;
        private long abstainCount;

        // For RATING
        private Double averageRating;
        private Map<Integer, Long> ratingDistribution; // star → count

        // Voter list (admin only, non-anonymous polls)
        private List<VoterInfo> voters;
    }

    @Data @Builder
    public static class VoterInfo {
        private String name;
        private String role;
        private String flat;
        private String votedFor; // display label of their vote
        private LocalDateTime votedAt;
    }
}
