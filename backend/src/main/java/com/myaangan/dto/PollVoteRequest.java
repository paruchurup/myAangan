package com.myaangan.dto;

import lombok.Data;
import java.util.List;

@Data
public class PollVoteRequest {
    // For SINGLE_CHOICE: single id; MULTIPLE_CHOICE: list of ids
    private List<Long> optionIds;
    // For YES_NO: "YES", "NO", "ABSTAIN"
    private String yesNoValue;
    // For RATING: 1-5
    private Integer ratingValue;
}
