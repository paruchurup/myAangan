package com.myaangan.service;

import com.myaangan.dto.NoticeRequest;
import com.myaangan.dto.NoticeResponse;
import com.myaangan.entity.*;
import com.myaangan.enums.NoticeStatus;
import com.myaangan.exception.ResourceNotFoundException;
import com.myaangan.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NoticeService {

    private final NoticeRepository       noticeRepo;
    private final NoticeReadRepository   readRepo;
    private final NoticeCommentRepository commentRepo;
    private final UserRepository         userRepo;

    private static final String UPLOAD_DIR = "/app/uploads/notices";

    // ── Create ────────────────────────────────────────────────────────────────
    public NoticeResponse create(NoticeRequest req, String creatorEmail,
                                 List<MultipartFile> files) throws IOException {
        User creator = findUser(creatorEmail);

        Notice notice = Notice.builder()
            .title(req.getTitle())
            .content(req.getContent())
            .type(req.getType())
            .priority(req.getPriority() != null ? req.getPriority() : com.myaangan.enums.NoticePriority.NORMAL)
            .status(NoticeStatus.DRAFT)
            .pinned(req.isPinned())
            .requiresAcknowledgement(req.isRequiresAcknowledgement())
            .targetBlocks(req.getTargetBlocks())
            .publishAt(req.getPublishAt())
            .expiresAt(req.getExpiresAt())
            .createdBy(creator)
            .build();

        // Handle file attachments
        if (files != null && !files.isEmpty()) {
            attachFiles(notice, files);
        }

        noticeRepo.save(notice);
        log.info("Notice '{}' created by {}", notice.getTitle(), creatorEmail);
        return toResponse(notice, creatorEmail, true);
    }

    // ── Update (DRAFT only) ───────────────────────────────────────────────────
    public NoticeResponse update(Long id, NoticeRequest req, String email,
                                 List<MultipartFile> files) throws IOException {
        Notice notice = findNotice(id);
        assertCanManage(notice, email);
        if (notice.getStatus() == NoticeStatus.ARCHIVED)
            throw new IllegalStateException("Archived notices cannot be edited");

        notice.setTitle(req.getTitle());
        notice.setContent(req.getContent());
        notice.setType(req.getType());
        notice.setPriority(req.getPriority());
        notice.setPinned(req.isPinned());
        notice.setRequiresAcknowledgement(req.isRequiresAcknowledgement());
        notice.setTargetBlocks(req.getTargetBlocks());
        notice.setPublishAt(req.getPublishAt());
        notice.setExpiresAt(req.getExpiresAt());

        if (files != null && !files.isEmpty()) {
            attachFiles(notice, files);
        }
        return toResponse(noticeRepo.save(notice), email, true);
    }

    // ── Publish ───────────────────────────────────────────────────────────────
    public NoticeResponse publish(Long id, String email) {
        Notice notice = findNotice(id);
        assertCanManage(notice, email);
        if (notice.getStatus() == NoticeStatus.PUBLISHED)
            throw new IllegalStateException("Already published");
        notice.setStatus(NoticeStatus.PUBLISHED);
        notice.setPublishedAt(LocalDateTime.now());
        log.info("Notice #{} published by {}", id, email);
        return toResponse(noticeRepo.save(notice), email, true);
    }

    // ── Archive ───────────────────────────────────────────────────────────────
    public NoticeResponse archive(Long id, String email) {
        Notice notice = findNotice(id);
        assertCanManage(notice, email);
        notice.setStatus(NoticeStatus.ARCHIVED);
        notice.setArchivedAt(LocalDateTime.now());
        notice.setPinned(false);
        return toResponse(noticeRepo.save(notice), email, true);
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    public void delete(Long id, String email) {
        Notice notice = findNotice(id);
        assertCanManage(notice, email);
        // Clean up attachment files
        for (NoticeAttachment a : notice.getAttachments()) {
            try { Files.deleteIfExists(Path.of(a.getStoredPath())); } catch (IOException ignored) {}
        }
        noticeRepo.delete(notice);
    }

    // ── Toggle pin ────────────────────────────────────────────────────────────
    public NoticeResponse togglePin(Long id, String email) {
        Notice notice = findNotice(id);
        assertCanManage(notice, email);
        notice.setPinned(!notice.isPinned());
        return toResponse(noticeRepo.save(notice), email, true);
    }

    // ── Delete attachment ─────────────────────────────────────────────────────
    public void deleteAttachment(Long attachmentId, String email) {
        noticeRepo.findAll().stream()
            .flatMap(n -> n.getAttachments().stream())
            .filter(a -> a.getId().equals(attachmentId))
            .findFirst()
            .ifPresent(a -> {
                assertCanManage(a.getNotice(), email);
                try { Files.deleteIfExists(Path.of(a.getStoredPath())); } catch (IOException ignored) {}
                a.getNotice().getAttachments().remove(a);
                noticeRepo.save(a.getNotice());
            });
    }

    // ── Mark as read ──────────────────────────────────────────────────────────
    public NoticeResponse markRead(Long id, String email) {
        Notice notice = findNotice(id);
        User user = findUser(email);
        if (!readRepo.existsByNoticeIdAndUserEmail(id, email)) {
            readRepo.save(NoticeRead.builder()
                .notice(notice).user(user).acknowledged(false).build());
        }
        return toResponse(notice, email, false);
    }

    // ── Acknowledge ───────────────────────────────────────────────────────────
    public NoticeResponse acknowledge(Long id, String email) {
        Notice notice = findNotice(id);
        if (!notice.isRequiresAcknowledgement())
            throw new IllegalStateException("This notice does not require acknowledgement");
        User user = findUser(email);
        NoticeRead read = readRepo.findByNoticeIdAndUserEmail(id, email)
            .orElse(NoticeRead.builder().notice(notice).user(user).build());
        read.setAcknowledged(true);
        read.setAcknowledgedAt(LocalDateTime.now());
        readRepo.save(read);
        return toResponse(notice, email, false);
    }

    // ── Add comment ───────────────────────────────────────────────────────────
    public NoticeResponse.CommentInfo addComment(Long id, String text, String email) {
        Notice notice = findNotice(id);
        if (notice.getStatus() == NoticeStatus.ARCHIVED)
            throw new IllegalStateException("Cannot comment on archived notices");
        User author = findUser(email);
        NoticeComment comment = NoticeComment.builder()
            .notice(notice).author(author).text(text).build();
        commentRepo.save(comment);
        return toCommentInfo(comment, email);
    }

    // ── Delete comment ────────────────────────────────────────────────────────
    public void deleteComment(Long commentId, String email) {
        NoticeComment c = commentRepo.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        User user = findUser(email);
        boolean canDel = c.getAuthor().getEmail().equals(email)
            || user.getRole().name().equals("ADMIN")
            || c.getNotice().getCreatedBy().getEmail().equals(email);
        if (!canDel) throw new SecurityException("Not authorised");
        commentRepo.delete(c);
    }

    // ── Queries ───────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<NoticeResponse> getPublished(String viewerEmail) {
        LocalDateTime now = LocalDateTime.now();
        return noticeRepo.findPublishedActive(now).stream()
            .map(n -> toResponse(n, viewerEmail, false))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NoticeResponse> getAllManageable(String email) {
        return noticeRepo.findAllManageable().stream()
            .map(n -> toResponse(n, email, true))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NoticeResponse> getArchived(String email) {
        return noticeRepo.findAllForAdmin().stream()
            .filter(n -> n.getStatus() == NoticeStatus.ARCHIVED)
            .map(n -> toResponse(n, email, true))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NoticeResponse getById(Long id, String viewerEmail) {
        Notice notice = findNotice(id);
        boolean mgr = canManage(notice, viewerEmail);
        return toResponse(notice, viewerEmail, mgr);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        return noticeRepo.countUnreadForUser(email, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<NoticeResponse.ReaderInfo> getReaders(Long id, String email) {
        Notice notice = findNotice(id);
        assertCanManage(notice, email);
        return readRepo.findByNoticeId(id).stream()
            .map(r -> NoticeResponse.ReaderInfo.builder()
                .name(r.getUser().getFirstName() + " " + r.getUser().getLastName())
                .role(r.getUser().getRole().name())
                .flat(flatLabel(r.getUser()))
                .acknowledged(r.isAcknowledged())
                .readAt(r.getReadAt())
                .acknowledgedAt(r.getAcknowledgedAt())
                .build())
            .collect(Collectors.toList());
    }

    // ── Scheduler ─────────────────────────────────────────────────────────────
    @Scheduled(fixedDelay = 60_000)
    public void processScheduled() {
        LocalDateTime now = LocalDateTime.now();
        noticeRepo.findDraftsDueToPublish(now).forEach(n -> {
            n.setStatus(NoticeStatus.PUBLISHED);
            n.setPublishedAt(now);
            noticeRepo.save(n);
            log.info("Auto-published notice #{}", n.getId());
        });
        noticeRepo.findPublishedDueToExpire(now).forEach(n -> {
            n.setStatus(NoticeStatus.ARCHIVED);
            n.setArchivedAt(now);
            n.setPinned(false);
            noticeRepo.save(n);
            log.info("Auto-archived notice #{}", n.getId());
        });
    }

    // ── File handling ─────────────────────────────────────────────────────────
    private void attachFiles(Notice notice, List<MultipartFile> files) throws IOException {
        Path uploadPath = Path.of(UPLOAD_DIR);
        Files.createDirectories(uploadPath);

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            String original = file.getOriginalFilename();
            String ext = original != null && original.contains(".")
                ? original.substring(original.lastIndexOf('.') + 1).toLowerCase() : "";
            String stored = UUID.randomUUID() + "." + ext;
            Path dest = uploadPath.resolve(stored);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            String fileType = ext.matches("jpg|jpeg|png|gif|webp") ? "IMAGE"
                : ext.equals("pdf") ? "PDF" : "DOCUMENT";

            notice.getAttachments().add(NoticeAttachment.builder()
                .notice(notice).originalName(original).storedPath(dest.toString())
                .fileType(fileType).fileSize(file.getSize()).build());
        }
    }

    // ── Mapper ────────────────────────────────────────────────────────────────
    private NoticeResponse toResponse(Notice n, String viewerEmail, boolean includeStats) {
        boolean isRead  = readRepo.existsByNoticeIdAndUserEmail(n.getId(), viewerEmail);
        boolean isAck   = readRepo.findByNoticeIdAndUserEmail(n.getId(), viewerEmail)
            .map(NoticeRead::isAcknowledged).orElse(false);
        long readCount  = includeStats ? readRepo.countReads(n.getId()) : 0;
        long ackCount   = includeStats ? readRepo.countAcknowledgements(n.getId()) : 0;
        boolean isNew   = n.getPublishedAt() != null
            && n.getPublishedAt().isAfter(LocalDateTime.now().minusHours(24)) && !isRead;

        List<NoticeResponse.AttachmentInfo> attachments = n.getAttachments().stream()
            .map(a -> NoticeResponse.AttachmentInfo.builder()
                .id(a.getId()).originalName(a.getOriginalName())
                .fileType(a.getFileType()).fileSize(a.getFileSize())
                .downloadUrl("/api/notices/attachments/" + a.getId())
                .build())
            .collect(Collectors.toList());

        List<NoticeResponse.CommentInfo> comments = n.getComments().stream()
            .map(c -> toCommentInfo(c, viewerEmail))
            .collect(Collectors.toList());

        return NoticeResponse.builder()
            .id(n.getId()).title(n.getTitle()).content(n.getContent())
            .type(n.getType()).priority(n.getPriority()).status(n.getStatus())
            .pinned(n.isPinned()).requiresAcknowledgement(n.isRequiresAcknowledgement())
            .targetBlocks(n.getTargetBlocks())
            .publishAt(n.getPublishAt()).expiresAt(n.getExpiresAt())
            .publishedAt(n.getPublishedAt()).createdAt(n.getCreatedAt()).updatedAt(n.getUpdatedAt())
            .createdByName(n.getCreatedBy().getFirstName() + " " + n.getCreatedBy().getLastName())
            .createdByRole(n.getCreatedBy().getRole().name())
            .isRead(isRead).isAcknowledged(isAck)
            .readCount(readCount).acknowledgedCount(ackCount)
            .attachments(attachments).comments(comments)
            .isNew(isNew)
            .build();
    }

    private NoticeResponse.CommentInfo toCommentInfo(NoticeComment c, String viewerEmail) {
        return NoticeResponse.CommentInfo.builder()
            .id(c.getId())
            .authorName(c.getAuthor().getFirstName() + " " + c.getAuthor().getLastName())
            .authorRole(c.getAuthor().getRole().name())
            .authorFlat(flatLabel(c.getAuthor()))
            .text(c.getText())
            .createdAt(c.getCreatedAt())
            .canDelete(c.getAuthor().getEmail().equals(viewerEmail))
            .build();
    }

    private String flatLabel(User u) {
        if (u.getFlatNumber() == null) return null;
        return (u.getBlock() != null ? u.getBlock() + "-" : "") + u.getFlatNumber();
    }

    private boolean canManage(Notice n, String email) {
        User user = userRepo.findByEmail(email).orElse(null);
        if (user == null) return false;
        return user.getRole().name().equals("ADMIN")
            || n.getCreatedBy().getEmail().equals(email);
    }

    private void assertCanManage(Notice n, String email) {
        if (!canManage(n, email))
            throw new SecurityException("Not authorised to manage this notice");
    }

    private Notice findNotice(Long id) {
        return noticeRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Notice not found: " + id));
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }
}
