package com.myaangan.repository;

import com.myaangan.entity.Complaint;
import com.myaangan.entity.User;
import com.myaangan.enums.ComplaintStatus;
import com.myaangan.enums.EscalationLevel;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    // Raised by a specific user (resident/guard sees their own)
    List<Complaint> findByRaisedBy(User user, Sort sort);

    // All complaints for FM/Admin
    List<Complaint> findAll(Sort sort);

    // Filter by status
    List<Complaint> findByStatus(ComplaintStatus status, Sort sort);

    // Filter by escalation level (for BM/BDA dashboards)
    List<Complaint> findByEscalationLevel(EscalationLevel level, Sort sort);

    // BM sees FM-escalated + their own level
    @Query("SELECT c FROM Complaint c WHERE c.escalationLevel IN :levels ORDER BY c.createdAt DESC")
    List<Complaint> findByEscalationLevelIn(@Param("levels") List<EscalationLevel> levels);

    // Auto-escalation: find complaints where SLA is overdue and not yet resolved/closed/rejected
    @Query("SELECT c FROM Complaint c WHERE c.slaDueAt < :now AND c.status NOT IN :excludedStatuses")
    List<Complaint> findOverdueSlaComplaints(
        @Param("now") LocalDateTime now,
        @Param("excludedStatuses") List<ComplaintStatus> excludedStatuses);

    // Count by status for dashboard stats
    long countByStatus(ComplaintStatus status);
    long countByEscalationLevel(EscalationLevel level);
    long countByRaisedBy(User user);
}
