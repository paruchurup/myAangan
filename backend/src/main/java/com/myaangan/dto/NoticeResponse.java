package com.myaangan.dto;

import com.myaangan.enums.NoticePriority;
import com.myaangan.enums.NoticeStatus;
import com.myaangan.enums.NoticeType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class NoticeResponse {

    private Long id;
    private String title;
    private String content;
    private NoticeType type;
    private NoticePriority priority;
    private NoticeStatus status;
    private boolean pinned;
    private boolean requiresAcknowledgement;
    private String targetBlocks;

    private LocalDateTime publishAt;
    private LocalDateTime expiresAt;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String createdByName;
    private String createdByRole;

    // Viewer-specific
    private boolean isRead;
    private boolean isAcknowledged;

    // Stats (visible to managers)
    private long readCount;
    private long acknowledgedCount;
    private long totalResidents;   // approximate target audience size

    private List<AttachmentInfo> attachments;
    private List<CommentInfo>    comments;

    // Unread badge — returned on list endpoints only
    private boolean isNew;         // published within last 24h and unread

    @Data @Builder
    public static class AttachmentInfo {
        private Long id;
        private String originalName;
        private String fileType;
        private long fileSize;
        private String downloadUrl;
    }

    @Data @Builder
    public static class CommentInfo {
        private Long id;
        private String authorName;
        private String authorRole;
        private String authorFlat;
        private String text;
        private LocalDateTime createdAt;
        private boolean canDelete;
    }

    @Data @Builder
    public static class ReaderInfo {
        private String name;
        private String role;
        private String flat;
        private boolean acknowledged;
        private LocalDateTime readAt;
        private LocalDateTime acknowledgedAt;
    }
}
