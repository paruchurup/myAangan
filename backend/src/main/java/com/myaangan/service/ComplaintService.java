package com.myaangan.service;

import com.myaangan.dto.*;
import com.myaangan.entity.*;
import com.myaangan.enums.*;
import com.myaangan.exception.ResourceNotFoundException;
import com.myaangan.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
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
public class ComplaintService {

    private final ComplaintRepository complaintRepo;
    private final ComplaintAttachmentRepository attachmentRepo;
    private final ComplaintCommentRepository commentRepo;
    private final EscalationSettingRepository escalationSettingRepo;
    private final UserRepository userRepo;

    @Value("${app.upload.complaints.dir:/app/uploads/complaints}")
    private String uploadDir;

    private static final int MAX_FILES = 10;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024L; // 5MB
    private static final List<String> ALLOWED_TYPES = List.of(
        "image/jpeg","image/png","application/pdf",
        "video/mp4","application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    private static final List<ComplaintStatus> TERMINAL_STATUSES =
        List.of(ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED, ComplaintStatus.REJECTED);

    // ── Raise complaint ───────────────────────────────────────────────────────
    public ComplaintResponse raiseComplaint(ComplaintRequest req, String raisedByEmail,
                                            List<MultipartFile> files) throws IOException {
        User raisedBy = findUser(raisedByEmail);

        // FM can raise on behalf of resident
        User effectiveRaisedBy = raisedBy;
        if (req.getRaisedOnBehalfOfUserId() != null
                && (raisedBy.getRole() == Role.FACILITY_MANAGER || raisedBy.getRole() == Role.ADMIN)) {
            effectiveRaisedBy = userRepo.findById(req.getRaisedOnBehalfOfUserId())
                .orElse(raisedBy);
        }

        int fmSla = getSlaHours("FM_SLA_HOURS", 48);
        LocalDateTime slaDue = LocalDateTime.now().plusHours(fmSla);

        Complaint complaint = Complaint.builder()
            .title(req.getTitle())
            .description(req.getDescription())
            .category(req.getCategory())
            .status(ComplaintStatus.OPEN)
            .escalationLevel(EscalationLevel.FACILITY_MANAGER)
            .slaDueAt(slaDue)
            .raisedBy(effectiveRaisedBy)
            .flatNumber(req.getFlatNumber() != null ? req.getFlatNumber()
                : effectiveRaisedBy.getFlatNumber())
            .block(req.getBlock() != null ? req.getBlock() : effectiveRaisedBy.getBlock())
            .locationDescription(req.getLocationDescription())
            .build();

        complaint = complaintRepo.save(complaint);

        // Log history
        logHistory(complaint, "Complaint raised", null,
            req.getCategory().getLabel(), raisedBy);

        // Handle file uploads
        if (files != null && !files.isEmpty()) {
            validateAndSaveFiles(complaint, files, raisedBy);
        }

        return ComplaintResponse.from(complaintRepo.findById(complaint.getId()).get(), false);
    }

    // ── Get complaint by ID ───────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaint(Long id, String requesterEmail) {
        Complaint c = findComplaint(id);
        User requester = findUser(requesterEmail);
        boolean canSeeInternal = canSeeInternalNotes(requester);
        return ComplaintResponse.from(c, canSeeInternal);
    }

    // ── My complaints (raised by me) ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getMyComplaints(String email) {
        User user = findUser(email);
        return complaintRepo.findByRaisedBy(user, Sort.by(Sort.Direction.DESC, "createdAt"))
            .stream().map(c -> ComplaintResponse.from(c, false))
            .collect(Collectors.toList());
    }

    // ── All complaints (FM/Admin) ─────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getAllComplaints(ComplaintStatus statusFilter, String email) {
        User requester = findUser(email);
        List<Complaint> list;

        if (statusFilter != null) {
            list = complaintRepo.findByStatus(statusFilter,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        } else {
            list = complaintRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        boolean seeInternal = canSeeInternalNotes(requester);
        return list.stream().map(c -> ComplaintResponse.from(c, seeInternal))
            .collect(Collectors.toList());
    }

    // ── BM dashboard: complaints escalated to BM or BDA ──────────────────────
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getEscalatedComplaints(EscalationLevel level, String email) {
        User requester = findUser(email);
        List<EscalationLevel> levels = level == EscalationLevel.BUILDER_MANAGER
            ? List.of(EscalationLevel.BUILDER_MANAGER, EscalationLevel.BDA_ENGINEER)
            : List.of(EscalationLevel.BDA_ENGINEER);

        return complaintRepo.findByEscalationLevelIn(levels)
            .stream().map(c -> ComplaintResponse.from(c, canSeeInternalNotes(requester)))
            .collect(Collectors.toList());
    }

    // ── Update status ─────────────────────────────────────────────────────────
    public ComplaintResponse updateStatus(Long id, ComplaintStatusUpdateRequest req,
                                          String updaterEmail) {
        Complaint c = findComplaint(id);
        User updater = findUser(updaterEmail);

        if (req.getStatus() == ComplaintStatus.REJECTED && req.getRejectionReason() == null) {
            throw new IllegalArgumentException("Rejection reason is required");
        }

        String oldStatus = c.getStatus().name();
        c.setStatus(req.getStatus());

        if (req.getRejectionReason() != null) c.setRejectionReason(req.getRejectionReason());
        if (req.getResolutionNote() != null)  c.setResolutionNote(req.getResolutionNote());

        LocalDateTime now = LocalDateTime.now();
        switch (req.getStatus()) {
            case ACKNOWLEDGED -> c.setAcknowledgedAt(now);
            case RESOLVED     -> { c.setResolvedAt(now); c.setSlaDueAt(null); }
            case CLOSED       -> c.setClosedAt(now);
            default -> {}
        }

        logHistory(c, "Status updated", oldStatus, req.getStatus().name(), updater);
        return ComplaintResponse.from(complaintRepo.save(c), canSeeInternalNotes(updater));
    }

    // ── Assign to FM ──────────────────────────────────────────────────────────
    public ComplaintResponse assignToMe(Long id, String fmEmail) {
        Complaint c = findComplaint(id);
        User fm = findUser(fmEmail);
        String old = c.getAssignedTo() != null ? c.getAssignedTo().getFirstName() : "Unassigned";
        c.setAssignedTo(fm);
        if (c.getStatus() == ComplaintStatus.OPEN) {
            c.setStatus(ComplaintStatus.ACKNOWLEDGED);
            c.setAcknowledgedAt(LocalDateTime.now());
            logHistory(c, "Status updated", "OPEN", "ACKNOWLEDGED", fm);
        }
        logHistory(c, "Assigned to", old, fm.getFirstName() + " " + fm.getLastName(), fm);
        return ComplaintResponse.from(complaintRepo.save(c), true);
    }

    // ── Manual escalation ─────────────────────────────────────────────────────
    public ComplaintResponse escalate(Long id, String escalatorEmail) {
        Complaint c = findComplaint(id);
        User escalator = findUser(escalatorEmail);
        String oldLevel = c.getEscalationLevel().name();

        EscalationLevel next = switch (c.getEscalationLevel()) {
            case FACILITY_MANAGER -> EscalationLevel.BUILDER_MANAGER;
            case BUILDER_MANAGER  -> EscalationLevel.BDA_ENGINEER;
            case BDA_ENGINEER     -> throw new IllegalStateException("Already at maximum escalation level");
        };

        int slaHours = getSlaHours(next == EscalationLevel.BUILDER_MANAGER
            ? "BM_SLA_HOURS" : "BDA_SLA_HOURS",
            next == EscalationLevel.BUILDER_MANAGER ? 168 : 720);

        c.setEscalationLevel(next);
        c.setSlaDueAt(LocalDateTime.now().plusHours(slaHours));
        logHistory(c, "Escalated", oldLevel, next.name(), escalator);
        return ComplaintResponse.from(complaintRepo.save(c), canSeeInternalNotes(escalator));
    }

    // ── Add comment ───────────────────────────────────────────────────────────
    public ComplaintResponse.CommentInfo addComment(Long id, ComplaintCommentRequest req,
                                                     String authorEmail) {
        Complaint c = findComplaint(id);
        User author = findUser(authorEmail);

        // Only privileged roles can add internal notes
        if (req.isInternal() && !canSeeInternalNotes(author)) {
            req.setInternal(false);
        }

        ComplaintComment comment = ComplaintComment.builder()
            .complaint(c)
            .text(req.getText())
            .author(author)
            .internal(req.isInternal())
            .build();

        return ComplaintResponse.CommentInfo.from(commentRepo.save(comment));
    }

    // ── Upload additional attachments ─────────────────────────────────────────
    public List<ComplaintResponse.AttachmentInfo> addAttachments(Long id,
            List<MultipartFile> files, String uploaderEmail) throws IOException {
        Complaint c = findComplaint(id);
        User uploader = findUser(uploaderEmail);
        long existing = attachmentRepo.countByComplaint(c);
        if (existing + files.size() > MAX_FILES) {
            throw new IllegalArgumentException(
                "Cannot exceed " + MAX_FILES + " attachments per complaint. "
                + "Currently has " + existing + ".");
        }
        return validateAndSaveFiles(c, files, uploader);
    }

    // ── Delete attachment ─────────────────────────────────────────────────────
    public void deleteAttachment(Long attachmentId, String requesterEmail) throws IOException {
        ComplaintAttachment att = attachmentRepo.findById(attachmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
        User requester = findUser(requesterEmail);

        // Only uploader, FM, or Admin can delete
        if (!att.getUploadedBy().getEmail().equals(requesterEmail)
                && requester.getRole() != Role.FACILITY_MANAGER
                && requester.getRole() != Role.ADMIN) {
            throw new SecurityException("Not authorized to delete this attachment");
        }

        Path filePath = Paths.get(uploadDir, att.getFilename());
        Files.deleteIfExists(filePath);
        attachmentRepo.delete(att);
    }

    // ── Auto-escalation scheduler (runs every hour) ───────────────────────────
    @Scheduled(fixedDelay = 3600000) // every hour
    @Transactional
    public void runAutoEscalation() {
        log.info("Running auto-escalation check...");
        List<Complaint> overdue = complaintRepo.findOverdueSlaComplaints(
            LocalDateTime.now(), TERMINAL_STATUSES);

        for (Complaint c : overdue) {
            try {
                if (c.getEscalationLevel() == EscalationLevel.BDA_ENGINEER) {
                    // Already at max — just log, no further escalation
                    log.warn("Complaint #{} is overdue at BDA_ENGINEER level", c.getId());
                    continue;
                }

                EscalationLevel next = c.getEscalationLevel() == EscalationLevel.FACILITY_MANAGER
                    ? EscalationLevel.BUILDER_MANAGER : EscalationLevel.BDA_ENGINEER;

                int slaHours = getSlaHours(next == EscalationLevel.BUILDER_MANAGER
                    ? "BM_SLA_HOURS" : "BDA_SLA_HOURS",
                    next == EscalationLevel.BUILDER_MANAGER ? 168 : 720);

                String oldLevel = c.getEscalationLevel().name();
                c.setEscalationLevel(next);
                c.setSlaDueAt(LocalDateTime.now().plusHours(slaHours));
                logHistory(c, "Auto-escalated (SLA breached)", oldLevel, next.name(), null);
                complaintRepo.save(c);
                log.info("Auto-escalated complaint #{} from {} to {}", c.getId(), oldLevel, next);
            } catch (Exception e) {
                log.error("Error auto-escalating complaint #{}: {}", c.getId(), e.getMessage());
            }
        }
    }

    // ── Dashboard stats ───────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Map<String, Long> getDashboardStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        for (ComplaintStatus s : ComplaintStatus.values()) {
            stats.put(s.name(), complaintRepo.countByStatus(s));
        }
        stats.put("ESCALATED_TO_BM",  complaintRepo.countByEscalationLevel(EscalationLevel.BUILDER_MANAGER));
        stats.put("ESCALATED_TO_BDA", complaintRepo.countByEscalationLevel(EscalationLevel.BDA_ENGINEER));
        return stats;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private List<ComplaintResponse.AttachmentInfo> validateAndSaveFiles(
            Complaint complaint, List<MultipartFile> files, User uploader) throws IOException {

        List<ComplaintResponse.AttachmentInfo> saved = new ArrayList<>();
        Files.createDirectories(Paths.get(uploadDir));

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new IllegalArgumentException(
                    "File '" + file.getOriginalFilename() + "' exceeds 5MB limit");
            }
            String mime = file.getContentType();
            if (mime == null || !ALLOWED_TYPES.contains(mime)) {
                throw new IllegalArgumentException(
                    "File type '" + mime + "' is not allowed");
            }

            String ext = getExtension(file.getOriginalFilename());
            String storedName = UUID.randomUUID() + ext;
            Path dest = Paths.get(uploadDir, storedName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            ComplaintAttachment att = ComplaintAttachment.builder()
                .complaint(complaint)
                .filename(storedName)
                .originalName(file.getOriginalFilename())
                .type(resolveType(mime))
                .fileSize(file.getSize())
                .mimeType(mime)
                .uploadedBy(uploader)
                .build();

            saved.add(ComplaintResponse.AttachmentInfo.from(attachmentRepo.save(att)));
        }
        return saved;
    }

    private void logHistory(Complaint c, String action, String oldVal,
                             String newVal, User performedBy) {
        ComplaintHistory h = ComplaintHistory.builder()
            .complaint(c).action(action)
            .oldValue(oldVal).newValue(newVal)
            .performedBy(performedBy)
            .build();
        // Use entity manager via cascade — just save to collection
        c.getHistory().add(h);
    }

    private int getSlaHours(String key, int defaultHours) {
        return escalationSettingRepo.findBySettingKey(key)
            .map(EscalationSetting::getHours)
            .orElse(defaultHours);
    }

    private Complaint findComplaint(Long id) {
        return complaintRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Complaint not found: " + id));
    }

    private User findUser(String email) {
        return userRepo.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private boolean canSeeInternalNotes(User user) {
        return switch (user.getRole()) {
            case ADMIN, FACILITY_MANAGER, BUILDER_MANAGER, BDA_ENGINEER,
                 PRESIDENT, SECRETARY, VOLUNTEER -> true;
            default -> false;
        };
    }

    private AttachmentType resolveType(String mime) {
        if (mime.startsWith("image/")) return AttachmentType.IMAGE;
        if (mime.equals("application/pdf")) return AttachmentType.PDF;
        if (mime.startsWith("video/")) return AttachmentType.VIDEO;
        return AttachmentType.DOCUMENT;
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
