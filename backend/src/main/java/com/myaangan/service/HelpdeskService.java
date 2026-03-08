package com.myaangan.service;

import com.myaangan.entity.*;
import com.myaangan.enums.Role;
import com.myaangan.enums.ServiceRequestStatus;
import com.myaangan.enums.ServiceCategory;
import com.myaangan.exception.ResourceNotFoundException;
import com.myaangan.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class HelpdeskService {

    private final ServiceRequestRepository          requestRepo;
    private final ServiceRequestPhotoRepository     photoRepo;
    private final ServiceRequestStatusLogRepository logRepo;
    private final UserRepository                    userRepo;

    @Value("${app.upload.helpdesk.dir:/app/uploads/helpdesk}")
    private String helpdeskDir;

    private static final int MAX_PHOTOS = 3;

    // ── Resident: raise a request ─────────────────────────────────────────

    public ServiceRequest createRequest(String title, String description,
                                         String category, String preferredDatetime,
                                         List<MultipartFile> photos,
                                         String residentEmail) throws Exception {
        User resident = findUser(residentEmail);
        ServiceRequest req = ServiceRequest.builder()
            .resident(resident).title(title).description(description)
            .category(ServiceCategory.valueOf(category.toUpperCase()))
            .preferredDatetime(preferredDatetime != null && !preferredDatetime.isBlank()
                ? LocalDateTime.parse(preferredDatetime) : null)
            .status(ServiceRequestStatus.PENDING)
            .build();
        req = requestRepo.save(req);

        if (photos != null) {
            int count = 0;
            for (MultipartFile f : photos) {
                if (f == null || f.isEmpty() || count >= MAX_PHOTOS) continue;
                String path = savePhoto(req.getId(), f);
                photoRepo.save(ServiceRequestPhoto.builder().request(req).photoPath(path).build());
                count++;
            }
        }
        logStatusChange(req, ServiceRequestStatus.PENDING, ServiceRequestStatus.PENDING, resident, "Request raised");
        log.info("Service request #{} raised by {} — {}", req.getId(), residentEmail, category);
        return req;
    }

    // ── FM: assign staff + confirm slot ───────────────────────────────────

    public ServiceRequest assignRequest(Long id, String staffName, String staffContact,
                                         String confirmedDatetime, String fmNote,
                                         String fmEmail) {
        ServiceRequest req = findRequest(id);
        if (req.getStatus() == ServiceRequestStatus.DONE || req.getStatus() == ServiceRequestStatus.CANCELLED)
            throw new IllegalStateException("Cannot modify a closed request.");

        ServiceRequestStatus prev = req.getStatus();
        req.setAssignedStaffName(staffName);
        req.setAssignedStaffContact(staffContact);
        req.setFmNote(fmNote);
        if (confirmedDatetime != null && !confirmedDatetime.isBlank())
            req.setConfirmedDatetime(LocalDateTime.parse(confirmedDatetime));
        req.setStatus(ServiceRequestStatus.ASSIGNED);
        req = requestRepo.save(req);

        User fm = findUser(fmEmail);
        logStatusChange(req, prev, ServiceRequestStatus.ASSIGNED, fm,
            "Assigned to " + staffName + (fmNote != null && !fmNote.isBlank() ? " — " + fmNote : ""));
        return req;
    }

    // ── FM: update status ─────────────────────────────────────────────────

    public ServiceRequest updateStatus(Long id, String newStatus, String note, String fmEmail) {
        ServiceRequest req = findRequest(id);
        ServiceRequestStatus next = ServiceRequestStatus.valueOf(newStatus.toUpperCase());
        validateTransition(req.getStatus(), next);
        ServiceRequestStatus prev = req.getStatus();
        req.setStatus(next);
        req = requestRepo.save(req);
        User fm = findUser(fmEmail);
        logStatusChange(req, prev, next, fm, note);
        log.info("Request #{} {} → {} by {}", id, prev, next, fmEmail);
        return req;
    }

    // ── Resident: cancel own request ──────────────────────────────────────

    public ServiceRequest cancelRequest(Long id, String residentEmail) {
        ServiceRequest req = findRequest(id);
        if (!req.getResident().getEmail().equals(residentEmail))
            throw new SecurityException("You can only cancel your own requests.");
        if (req.getStatus() == ServiceRequestStatus.IN_PROGRESS
            || req.getStatus() == ServiceRequestStatus.DONE
            || req.getStatus() == ServiceRequestStatus.CANCELLED)
            throw new IllegalStateException("Cannot cancel a request in " + req.getStatus() + " status.");
        ServiceRequestStatus prev = req.getStatus();
        req.setStatus(ServiceRequestStatus.CANCELLED);
        req = requestRepo.save(req);
        User resident = findUser(residentEmail);
        logStatusChange(req, prev, ServiceRequestStatus.CANCELLED, resident, "Cancelled by resident");
        return req;
    }

    // ── Queries ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ServiceRequest> getMyRequests(String email) {
        return requestRepo.findByResidentEmailOrderByCreatedAtDesc(email);
    }

    @Transactional(readOnly = true)
    public List<ServiceRequest> getAllRequests() {
        return requestRepo.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRequestDetail(Long id, String viewerEmail) {
        ServiceRequest req = findRequest(id);
        User viewer = findUser(viewerEmail);
        boolean isOwner = req.getResident().getEmail().equals(viewerEmail);
        boolean isStaff = viewer.getRole() == Role.FACILITY_MANAGER
            || viewer.getRole() == Role.ADMIN
            || viewer.getRole() == Role.PRESIDENT
            || viewer.getRole() == Role.SECRETARY;
        if (!isOwner && !isStaff) throw new SecurityException("Access denied.");

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("request",   req);
        m.put("photos",    photoRepo.findByRequestId(id));
        m.put("statusLog", logRepo.findByRequestIdOrderByChangedAtAsc(id));
        m.put("canManage", isStaff);
        return m;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFmDashboard() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("pending",    requestRepo.countByStatus(ServiceRequestStatus.PENDING));
        m.put("assigned",   requestRepo.countByStatus(ServiceRequestStatus.ASSIGNED));
        m.put("inProgress", requestRepo.countByStatus(ServiceRequestStatus.IN_PROGRESS));
        m.put("done",       requestRepo.countByStatus(ServiceRequestStatus.DONE));
        m.put("open",       requestRepo.findAllOpen());
        return m;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getStatusCounts() {
        Map<String, Long> m = new LinkedHashMap<>();
        m.put("PENDING",     requestRepo.countByStatus(ServiceRequestStatus.PENDING));
        m.put("ASSIGNED",    requestRepo.countByStatus(ServiceRequestStatus.ASSIGNED));
        m.put("IN_PROGRESS", requestRepo.countByStatus(ServiceRequestStatus.IN_PROGRESS));
        m.put("DONE",        requestRepo.countByStatus(ServiceRequestStatus.DONE));
        m.put("CANCELLED",   requestRepo.countByStatus(ServiceRequestStatus.CANCELLED));
        return m;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private String savePhoto(Long requestId, MultipartFile file) throws Exception {
        Path dir = Paths.get(helpdeskDir, "photos");
        Files.createDirectories(dir);
        String fname = "req-" + requestId + "-" + System.currentTimeMillis() + "-" + file.getOriginalFilename();
        Files.copy(file.getInputStream(), dir.resolve(fname), StandardCopyOption.REPLACE_EXISTING);
        return "photos/" + fname;
    }

    private void logStatusChange(ServiceRequest req, ServiceRequestStatus from,
                                  ServiceRequestStatus to, User changedBy, String note) {
        logRepo.save(ServiceRequestStatusLog.builder()
            .request(req).fromStatus(from).toStatus(to)
            .changedBy(changedBy).note(note).build());
    }

    private void validateTransition(ServiceRequestStatus from, ServiceRequestStatus to) {
        boolean valid = switch (from) {
            case PENDING     -> to == ServiceRequestStatus.ASSIGNED    || to == ServiceRequestStatus.CANCELLED;
            case ASSIGNED    -> to == ServiceRequestStatus.IN_PROGRESS || to == ServiceRequestStatus.CANCELLED;
            case IN_PROGRESS -> to == ServiceRequestStatus.DONE        || to == ServiceRequestStatus.CANCELLED;
            case DONE, CANCELLED -> false;
        };
        if (!valid) throw new IllegalStateException("Invalid transition: " + from + " → " + to);
    }

    private ServiceRequest findRequest(Long id) {
        return requestRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Service request not found"));
    }
    private User findUser(String email) {
        return userRepo.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
