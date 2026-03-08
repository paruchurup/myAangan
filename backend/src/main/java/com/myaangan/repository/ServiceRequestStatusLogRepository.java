package com.myaangan.repository;
import com.myaangan.entity.ServiceRequestStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceRequestStatusLogRepository extends JpaRepository<ServiceRequestStatusLog, Long> {
    List<ServiceRequestStatusLog> findByRequestIdOrderByChangedAtAsc(Long requestId);
}
