package com.myaangan.dto;

import com.myaangan.enums.NoticePriority;
import com.myaangan.enums.NoticeType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NoticeRequest {

    @NotBlank @Size(max = 300)
    private String title;

    @NotBlank @Size(max = 5000)
    private String content;

    @NotNull
    private NoticeType type;

    private NoticePriority priority = NoticePriority.NORMAL;

    private boolean pinned = false;
    private boolean requiresAcknowledgement = false;

    private String targetBlocks;      // null = all, "A,B" = specific blocks

    private LocalDateTime publishAt;  // null = publish immediately on publish action
    private LocalDateTime expiresAt;  // null = never expires
}
