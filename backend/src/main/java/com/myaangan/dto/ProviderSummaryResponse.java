package com.myaangan.dto;

import com.myaangan.entity.ServiceProvider;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProviderSummaryResponse {
    private Long id;
    private String name;
    private String phone;
    private String area;
    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String availability;
    private double avgRating;
    private int reviewCount;
    private String addedByName;
    private Long addedById;
    private LocalDateTime createdAt;

    public static ProviderSummaryResponse from(ServiceProvider p) {
        ProviderSummaryResponse r = new ProviderSummaryResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setPhone(p.getPhone());
        r.setArea(p.getArea());
        r.setCategoryId(p.getCategory().getId());
        r.setCategoryName(p.getCategory().getName());
        r.setCategoryIcon(p.getCategory().getIcon());
        r.setAvailability(p.getAvailability().name());
        r.setAvgRating(Math.round(p.getAvgRating() * 10.0) / 10.0);
        r.setReviewCount(p.getReviewCount());
        r.setAddedByName(p.getAddedBy().getFirstName() + " " + p.getAddedBy().getLastName());
        r.setAddedById(p.getAddedBy().getId());
        r.setCreatedAt(p.getCreatedAt());
        return r;
    }
}
