package com.myaangan.repository;

import com.myaangan.entity.Complaint;
import com.myaangan.entity.ComplaintAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintAttachmentRepository extends JpaRepository<ComplaintAttachment, Long> {
    List<ComplaintAttachment> findByComplaint(Complaint complaint);
    long countByComplaint(Complaint complaint);
}
