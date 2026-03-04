package com.myaangan.dto;

import com.myaangan.enums.PollType;
import com.myaangan.enums.ResultVisibility;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PollRequest {

    @NotBlank @Size(max = 300)
    private String question;

    @Size(max = 1000)
    private String description;

    @NotNull
    private PollType type;

    private ResultVisibility resultVisibility = ResultVisibility.AFTER_VOTE;

    private LocalDateTime startsAt;
    private LocalDateTime endsAt;

    private boolean anonymous = false;
    private boolean allowVoteChange = true;
    private boolean allowComments = true;
    private int maxChoices = 0;

    private String targetBlocks; // e.g. "A,B,C" or null for all

    // Required for SINGLE_CHOICE / MULTIPLE_CHOICE
    private List<OptionRequest> options;

    @Data
    public static class OptionRequest {
        @NotBlank @Size(max = 300)
        private String text;
        private String emoji;
        private int displayOrder;
    }
}
