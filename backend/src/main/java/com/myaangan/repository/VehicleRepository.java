package com.myaangan.repository;

import com.myaangan.entity.Vehicle;
import com.myaangan.enums.VehicleStatus;
import com.myaangan.enums.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByOwnerEmailOrderByCreatedAtDesc(String email);
    List<Vehicle> findByStatusOrderByCreatedAtDesc(VehicleStatus status);
    List<Vehicle> findAllByOrderByCreatedAtDesc();
    Optional<Vehicle> findByPlateNumberIgnoreCase(String plate);
    boolean existsByPlateNumberIgnoreCase(String plate);

    @Query("SELECT v FROM Vehicle v WHERE v.status = 'APPROVED' ORDER BY v.owner.block, v.owner.flatNumber")
    List<Vehicle> findApprovedForGuardView();

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.status = :status")
    long countByStatus(@Param("status") VehicleStatus status);

    boolean existsByAssignedSlotIdAndType(Long slotId, VehicleType type);
    List<Vehicle> findByAssignedSlotId(Long slotId);
}
