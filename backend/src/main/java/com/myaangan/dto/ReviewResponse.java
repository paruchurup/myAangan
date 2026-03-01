package com.myaangan.dto;

import com.myaangan.entity.ServiceReview;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Long id;
    private int stars;
    private String comment;
    private String reviewerName;
    private Long reviewerId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse from(ServiceReview r) {
        ReviewResponse dto = new ReviewResponse();
        dto.setId(r.getId());
        dto.setStars(r.getStars());
        dto.setComment(r.getComment());
        dto.setReviewerName(r.getReviewedBy().getFirstName() + " " + r.getReviewedBy().getLastName());
        dto.setReviewerId(r.getReviewedBy().getId());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setUpdatedAt(r.getUpdatedAt());
        return dto;
    }
}
