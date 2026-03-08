package com.myaangan.service;

import com.myaangan.entity.*;
import com.myaangan.enums.*;
import com.myaangan.exception.ResourceNotFoundException;
import com.myaangan.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class VaultService {

    private final VaultDocumentRepository docRepo;
    private final NocRequestRepository    nocRepo;
    private final UserRepository          userRepo;

    @Value("${app.upload.vault.dir:/app/uploads/vault}")
    private String vaultDir;

    private static final Set<String> ALLOWED_TYPES = Set.of(
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    private static final Map<String, String> FORMAT_MAP = Map.of(
        "application/pdf", "PDF",
        "image/jpeg", "JPG", "image/jpg", "JPG", "image/png", "PNG",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "DOCX"
    );

    // ── Upload a document (Admin/President/Secretary) ─────────────────────

    public VaultDocument uploadDocument(String title, String description, String type,
                                         String residentEmail, Long nocRequestId,
                                         String expiryDate, MultipartFile file,
                                         String uploaderEmail) throws Exception {
        validateFile(file);
        User uploader = findUser(uploaderEmail);
        DocumentType docType = DocumentType.valueOf(type.toUpperCase());

        User resident = null;
        NocRequest nocRequest = null;

        if (docType == DocumentType.NOC) {
            if (residentEmail == null || residentEmail.isBlank())
                throw new IllegalArgumentException("NOC documents must be linked to a resident.");
            resident = findUser(residentEmail);
            if (nocRequestId != null) {
                nocRequest = nocRepo.findById(nocRequestId)
                    .orElseThrow(() -> new ResourceNotFoundException("NOC request not found"));
                nocRequest.setStatus(NocRequestStatus.FULFILLED);
                nocRequest.setHandledBy(uploader);
                nocRepo.save(nocRequest);
            }
        }

        String filePath = saveFile(file, docType.name().toLowerCase());
        String format   = FORMAT_MAP.getOrDefault(file.getContentType(), "PDF");

        VaultDocument doc = VaultDocument.builder()
            .type(docType).title(title).description(description)
            .filePath(filePath).fileFormat(format)
            .resident(resident).nocRequest(nocRequest)
            .uploadedBy(uploader)
            .expiryDate(expiryDate != null && !expiryDate.isBlank() ? LocalDate.parse(expiryDate) : null)
            .active(true)
            .build();
        doc = docRepo.save(doc);
        log.info("Document '{}' ({}) uploaded by {}", title, docType, uploaderEmail);
        return doc;
    }

    // ── Delete / deactivate a document ────────────────────────────────────

    public void deleteDocument(Long id, String adminEmail) {
        VaultDocument doc = findDoc(id);
        doc.setActive(false);
        docRepo.save(doc);
        log.info("Document #{} deactivated by {}", id, adminEmail);
    }

    // ── Resident: request an NOC ──────────────────────────────────────────

    public NocRequest requestNoc(String purpose, String details, String residentEmail) {
        User resident = findUser(residentEmail);
        NocRequest req = NocRequest.builder()
            .resident(resident).purpose(purpose).details(details)
            .status(NocRequestStatus.PENDING)
            .build();
        log.info("NOC request raised by {} for: {}", residentEmail, purpose);
        return nocRepo.save(req);
    }

    // ── Admin: reject an NOC request ─────────────────────────────────────

    public NocRequest rejectNocRequest(Long id, String reason, String adminEmail) {
        NocRequest req = findNocRequest(id);
        if (req.getStatus() != NocRequestStatus.PENDING)
            throw new IllegalStateException("Only PENDING NOC requests can be rejected.");
        req.setStatus(NocRequestStatus.REJECTED);
        req.setRejectionReason(reason);
        req.setHandledBy(findUser(adminEmail));
        return nocRepo.save(req);
    }

    // ── Queries: resident ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getResidentVault(String email) {
        List<VaultDocument> all = docRepo.findVisibleToResident(email);

        List<VaultDocument> society     = all.stream().filter(d -> d.getType() == DocumentType.SOCIETY).toList();
        List<VaultDocument> nocs        = all.stream().filter(d -> d.getType() == DocumentType.NOC).toList();
        List<VaultDocument> maintenance = all.stream().filter(d -> d.getType() == DocumentType.MAINTENANCE).toList();
        List<NocRequest>    myRequests  = nocRepo.findByResidentEmailOrderByCreatedAtDesc(email);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("society",     society);
        m.put("nocs",        nocs);
        m.put("maintenance", maintenance);
        m.put("nocRequests", myRequests);
        return m;
    }

    // ── Queries: admin ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getAdminVault() {
        List<VaultDocument> all  = docRepo.findAllByActiveTrueOrderByCreatedAtDesc();
        List<NocRequest> nocReqs = nocRepo.findAllByOrderByCreatedAtDesc();

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("all",            all);
        m.put("society",        all.stream().filter(d -> d.getType() == DocumentType.SOCIETY).toList());
        m.put("nocs",           all.stream().filter(d -> d.getType() == DocumentType.NOC).toList());
        m.put("maintenance",    all.stream().filter(d -> d.getType() == DocumentType.MAINTENANCE).toList());
        m.put("nocRequests",    nocReqs);
        m.put("pendingNocs",    nocRepo.countByStatus(NocRequestStatus.PENDING));
        return m;
    }

    @Transactional(readOnly = true)
    public List<NocRequest> getPendingNocRequests() {
        return nocRepo.findByStatusOrderByCreatedAtDesc(NocRequestStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public VaultDocument getDocument(Long id, String viewerEmail) {
        VaultDocument doc = findDoc(id);
        User viewer = findUser(viewerEmail);
        boolean isStaff = viewer.getRole() == Role.ADMIN
            || viewer.getRole() == Role.PRESIDENT
            || viewer.getRole() == Role.SECRETARY;
        boolean isOwner = doc.getResident() != null
            && doc.getResident().getEmail().equals(viewerEmail);
        boolean isPublic = doc.getType() == DocumentType.SOCIETY
            || doc.getType() == DocumentType.MAINTENANCE;

        if (!isStaff && !isOwner && !isPublic)
            throw new SecurityException("Access denied to this document.");
        return doc;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private String saveFile(MultipartFile file, String subdir) throws Exception {
        Path dir = Paths.get(vaultDir, subdir);
        Files.createDirectories(dir);
        String fname = System.currentTimeMillis() + "-" + file.getOriginalFilename()
            .replaceAll("[^a-zA-Z0-9._-]", "_");
        Files.copy(file.getInputStream(), dir.resolve(fname), StandardCopyOption.REPLACE_EXISTING);
        return subdir + "/" + fname;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("File is required.");
        String ct = file.getContentType();
        if (ct == null || !ALLOWED_TYPES.contains(ct))
            throw new IllegalArgumentException("File format not allowed. Accepted: PDF, JPG, PNG, DOCX.");
        if (file.getSize() > 20 * 1024 * 1024)
            throw new IllegalArgumentException("File size must be under 20 MB.");
    }

    private VaultDocument findDoc(Long id) {
        return docRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Document not found"));
    }
    private NocRequest findNocRequest(Long id) {
        return nocRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("NOC request not found"));
    }
    private User findUser(String email) {
        return userRepo.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
