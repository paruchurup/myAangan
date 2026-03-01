package com.myaangan.dto;

import com.myaangan.entity.ServiceProvider;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProviderDetailResponse {
    private Long id;
    private String name;
    private String phone;
    private String area;
    private String photoUrl;        // Phase 2B
    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String availability;
    private double avgRating;
    private int reviewCount;
    private String addedByName;
    private Long addedById;
    private LocalDateTime createdAt;
    private List<ReviewResponse> reviews;

    public static ProviderDetailResponse from(ServiceProvider p, List<ReviewResponse> reviews) {
        ProviderDetailResponse r = new ProviderDetailResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setPhone(p.getPhone());
        r.setArea(p.getArea());
        r.setPhotoUrl(p.getPhotoFilename() != null
            ? "/uploads/photos/" + p.getPhotoFilename() : null);
        r.setCategoryId(p.getCategory().getId());
        r.setCategoryName(p.getCategory().getName());
        r.setCategoryIcon(p.getCategory().getIcon());
        r.setAvailability(p.getAvailability().name());
        r.setAvgRating(Math.round(p.getAvgRating() * 10.0) / 10.0);
        r.setReviewCount(p.getReviewCount());
        r.setAddedByName(p.getAddedBy().getFirstName() + " " + p.getAddedBy().getLastName());
        r.setAddedById(p.getAddedBy().getId());
        r.setCreatedAt(p.getCreatedAt());
        r.setReviews(reviews);
        return r;
    }
}
