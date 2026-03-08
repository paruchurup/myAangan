package com.myaangan.repository;

import com.myaangan.entity.NocRequest;
import com.myaangan.enums.NocRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NocRequestRepository extends JpaRepository<NocRequest, Long> {
    List<NocRequest> findByResidentEmailOrderByCreatedAtDesc(String email);
    List<NocRequest> findAllByOrderByCreatedAtDesc();
    List<NocRequest> findByStatusOrderByCreatedAtDesc(NocRequestStatus status);
    long countByStatus(NocRequestStatus status);
}
