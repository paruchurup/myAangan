package com.myaangan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ComplaintCommentRequest {

    @NotBlank
    @Size(max = 2000)
    private String text;

    private boolean internal = false;  // FM/Admin only — hidden from residents
}
