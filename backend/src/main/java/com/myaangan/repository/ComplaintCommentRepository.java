package com.myaangan.repository;

import com.myaangan.entity.Complaint;
import com.myaangan.entity.ComplaintComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintCommentRepository extends JpaRepository<ComplaintComment, Long> {
    // Resident sees only public comments; FM/Admin/BM/BDA see all
    List<ComplaintComment> findByComplaintAndInternalFalseOrderByCreatedAtAsc(Complaint complaint);
    List<ComplaintComment> findByComplaintOrderByCreatedAtAsc(Complaint complaint);
}
