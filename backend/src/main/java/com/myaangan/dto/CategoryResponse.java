package com.myaangan.dto;

import com.myaangan.entity.ServiceCategory;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CategoryResponse {
    private Long id;
    private String name;
    private String icon;
    private boolean active;
    private LocalDateTime createdAt;

    public static CategoryResponse from(ServiceCategory c) {
        CategoryResponse r = new CategoryResponse();
        r.setId(c.getId());
        r.setName(c.getName());
        r.setIcon(c.getIcon());
        r.setActive(c.isActive());
        r.setCreatedAt(c.getCreatedAt());
        return r;
    }
}
