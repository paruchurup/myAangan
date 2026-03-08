package com.myaangan.repository;
import com.myaangan.entity.ServiceRequestPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceRequestPhotoRepository extends JpaRepository<ServiceRequestPhoto, Long> {
    List<ServiceRequestPhoto> findByRequestId(Long requestId);
    long countByRequestId(Long requestId);
}
