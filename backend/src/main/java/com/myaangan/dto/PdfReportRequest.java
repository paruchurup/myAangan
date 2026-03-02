package com.myaangan.dto;

import com.myaangan.enums.ComplaintStatus;
import lombok.Data;

import java.util.List;

@Data
public class PdfReportRequest {
    private String coveringLetter;    // typed by President/Secretary/Volunteer
    private String reportTitle;       // e.g. "Complaints Report — March 2025"
    private String societyName;
    private String addressedTo;       // e.g. "The BDA Engineer, Bengaluru"
    private List<ComplaintStatus> includeStatuses;  // null = all
    private boolean includeResolved;
    private boolean includeClosed;
}
