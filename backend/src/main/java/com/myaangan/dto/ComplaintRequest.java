package com.myaangan.dto;

import com.myaangan.enums.ComplaintCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ComplaintRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 2000)
    private String description;

    @NotNull(message = "Category is required")
    private ComplaintCategory category;

    private String flatNumber;
    private String block;
    private String locationDescription;

    // For FM raising on behalf of resident
    private Long raisedOnBehalfOfUserId;
}
