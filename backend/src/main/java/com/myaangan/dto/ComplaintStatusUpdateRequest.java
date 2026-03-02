package com.myaangan.dto;

import com.myaangan.enums.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ComplaintStatusUpdateRequest {

    @NotNull
    private ComplaintStatus status;

    @Size(max = 500)
    private String rejectionReason;  // required when status = REJECTED

    @Size(max = 1000)
    private String resolutionNote;   // optional when status = RESOLVED
}
