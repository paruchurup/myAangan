package com.myaangan.repository;

import com.myaangan.entity.ServiceRequest;
import com.myaangan.enums.ServiceCategory;
import com.myaangan.enums.ServiceRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    List<ServiceRequest> findByResidentEmailOrderByCreatedAtDesc(String email);
    List<ServiceRequest> findAllByOrderByCreatedAtDesc();
    List<ServiceRequest> findByStatusOrderByCreatedAtDesc(ServiceRequestStatus status);
    List<ServiceRequest> findByCategoryOrderByCreatedAtDesc(ServiceCategory category);
    @Query("SELECT s FROM ServiceRequest s WHERE s.status NOT IN ('DONE','CANCELLED') ORDER BY s.createdAt DESC")
    List<ServiceRequest> findAllOpen();
    long countByStatus(ServiceRequestStatus status);
}
