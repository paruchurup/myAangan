package com.myaangan.dto;

import com.myaangan.entity.Complaint;
import com.myaangan.entity.ComplaintAttachment;
import com.myaangan.entity.ComplaintComment;
import com.myaangan.entity.ComplaintHistory;
import com.myaangan.enums.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class ComplaintResponse {

    private Long id;
    private String title;
    private String description;
    private ComplaintCategory category;
    private String categoryLabel;
    private ComplaintStatus status;
    private String statusLabel;
    private EscalationLevel escalationLevel;
    private String escalationLabel;
    private LocalDateTime slaDueAt;
    private boolean slaBreached;

    private String raisedByName;
    private String raisedByRole;
    private String raisedByFlat;
    private String assignedToName;

    private String flatNumber;
    private String block;
    private String locationDescription;
    private String rejectionReason;
    private String resolutionNote;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;

    private List<AttachmentInfo> attachments;
    private List<CommentInfo> comments;
    private List<HistoryInfo> history;
    private int attachmentCount;
    private int commentCount;

    @Data
    public static class AttachmentInfo {
        private Long id;
        private String filename;
        private String originalName;
        private AttachmentType type;
        private Long fileSize;
        private String mimeType;
        private String uploadedByName;
        private LocalDateTime uploadedAt;
        private String url;

        public static AttachmentInfo from(ComplaintAttachment a) {
            AttachmentInfo i = new AttachmentInfo();
            i.setId(a.getId());
            i.setFilename(a.getFilename());
            i.setOriginalName(a.getOriginalName());
            i.setType(a.getType());
            i.setFileSize(a.getFileSize());
            i.setMimeType(a.getMimeType());
            i.setUploadedByName(a.getUploadedBy() != null
                ? a.getUploadedBy().getFirstName() + " " + a.getUploadedBy().getLastName() : "");
            i.setUploadedAt(a.getUploadedAt());
            i.setUrl("/uploads/complaints/" + a.getFilename());
            return i;
        }
    }

    @Data
    public static class CommentInfo {
        private Long id;
        private String text;
        private String authorName;
        private String authorRole;
        private boolean internal;
        private LocalDateTime createdAt;

        public static CommentInfo from(ComplaintComment c) {
            CommentInfo i = new CommentInfo();
            i.setId(c.getId());
            i.setText(c.getText());
            i.setAuthorName(c.getAuthor().getFirstName() + " " + c.getAuthor().getLastName());
            i.setAuthorRole(c.getAuthor().getRole().name());
            i.setInternal(c.isInternal());
            i.setCreatedAt(c.getCreatedAt());
            return i;
        }
    }

    @Data
    public static class HistoryInfo {
        private String action;
        private String oldValue;
        private String newValue;
        private String performedBy;
        private LocalDateTime createdAt;

        public static HistoryInfo from(ComplaintHistory h) {
            HistoryInfo i = new HistoryInfo();
            i.setAction(h.getAction());
            i.setOldValue(h.getOldValue());
            i.setNewValue(h.getNewValue());
            i.setPerformedBy(h.getPerformedBy() != null
                ? h.getPerformedBy().getFirstName() + " " + h.getPerformedBy().getLastName()
                : "System");
            i.setCreatedAt(h.getCreatedAt());
            return i;
        }
    }

    public static ComplaintResponse from(Complaint c, boolean includeInternalComments) {
        ComplaintResponse r = new ComplaintResponse();
        r.setId(c.getId());
        r.setTitle(c.getTitle());
        r.setDescription(c.getDescription());
        r.setCategory(c.getCategory());
        r.setCategoryLabel(c.getCategory().getLabel());
        r.setStatus(c.getStatus());
        r.setStatusLabel(statusLabel(c.getStatus()));
        r.setEscalationLevel(c.getEscalationLevel());
        r.setEscalationLabel(escalationLabel(c.getEscalationLevel()));
        r.setSlaDueAt(c.getSlaDueAt());
        r.setSlaBreached(c.getSlaDueAt() != null && c.getSlaDueAt().isBefore(LocalDateTime.now())
            && c.getStatus() != ComplaintStatus.RESOLVED
            && c.getStatus() != ComplaintStatus.CLOSED
            && c.getStatus() != ComplaintStatus.REJECTED);
        r.setRaisedByName(c.getRaisedBy().getFirstName() + " " + c.getRaisedBy().getLastName());
        r.setRaisedByRole(c.getRaisedBy().getRole().name());
        r.setRaisedByFlat(c.getRaisedBy().getFlatNumber() != null
            ? (c.getRaisedBy().getBlock() != null ? c.getRaisedBy().getBlock() + "-" : "")
              + c.getRaisedBy().getFlatNumber() : null);
        r.setAssignedToName(c.getAssignedTo() != null
            ? c.getAssignedTo().getFirstName() + " " + c.getAssignedTo().getLastName() : null);
        r.setFlatNumber(c.getFlatNumber());
        r.setBlock(c.getBlock());
        r.setLocationDescription(c.getLocationDescription());
        r.setRejectionReason(c.getRejectionReason());
        r.setResolutionNote(c.getResolutionNote());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());
        r.setAcknowledgedAt(c.getAcknowledgedAt());
        r.setResolvedAt(c.getResolvedAt());
        r.setClosedAt(c.getClosedAt());

        if (c.getAttachments() != null) {
            r.setAttachments(c.getAttachments().stream()
                .map(AttachmentInfo::from).collect(Collectors.toList()));
            r.setAttachmentCount(c.getAttachments().size());
        }

        if (c.getComments() != null) {
            List<ComplaintComment> filtered = includeInternalComments
                ? c.getComments()
                : c.getComments().stream().filter(cm -> !cm.isInternal()).collect(Collectors.toList());
            r.setComments(filtered.stream().map(CommentInfo::from).collect(Collectors.toList()));
            r.setCommentCount(filtered.size());
        }

        if (c.getHistory() != null) {
            r.setHistory(c.getHistory().stream()
                .map(HistoryInfo::from).collect(Collectors.toList()));
        }
        return r;
    }

    private static String statusLabel(ComplaintStatus s) {
        return switch (s) {
            case OPEN         -> "🔴 Open";
            case ACKNOWLEDGED -> "🟡 Acknowledged";
            case IN_PROGRESS  -> "🔵 In Progress";
            case RESOLVED     -> "🟢 Resolved";
            case CLOSED       -> "⚫ Closed";
            case REJECTED     -> "❌ Rejected";
        };
    }

    private static String escalationLabel(EscalationLevel l) {
        return switch (l) {
            case FACILITY_MANAGER -> "Facility Manager";
            case BUILDER_MANAGER  -> "Builder Manager";
            case BDA_ENGINEER     -> "BDA Engineer";
        };
    }
}
