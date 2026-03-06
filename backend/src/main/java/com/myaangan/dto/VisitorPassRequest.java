package com.myaangan.dto;

import com.myaangan.enums.PassType;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class VisitorPassRequest {
    private String      visitorName;
    private String      visitorPhone;
    private String      purpose;
    private PassType    passType;

    // ONE_TIME
    private LocalDate   validDate;
    private LocalTime   windowStart;
    private LocalTime   windowEnd;

    // STANDING
    private List<Integer> allowedDays;   // 1=Mon … 7=Sun
    private LocalDate   standingFrom;
    private LocalDate   standingUntil;

    private String      notes;
}
