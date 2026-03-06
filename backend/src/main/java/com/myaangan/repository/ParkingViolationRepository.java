package com.myaangan.repository;

import com.myaangan.entity.ParkingViolation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ParkingViolationRepository extends JpaRepository<ParkingViolation, Long> {
    @Query("SELECT v FROM ParkingViolation v ORDER BY v.reportedAt DESC")
    List<ParkingViolation> findAllOrderByReportedAtDesc();

    @Query("SELECT v FROM ParkingViolation v WHERE v.resolved = false ORDER BY v.reportedAt DESC")
    List<ParkingViolation> findUnresolved();

    List<ParkingViolation> findByVehicleIdOrderByReportedAtDesc(Long vehicleId);
    long countByResolvedFalse();
}
