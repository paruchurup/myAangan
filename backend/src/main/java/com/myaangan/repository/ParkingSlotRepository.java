package com.myaangan.repository;

import com.myaangan.entity.ParkingSlot;
import com.myaangan.enums.SlotStatus;
import com.myaangan.enums.SlotType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {
    List<ParkingSlot> findAllByOrderByBlockAscSlotNumberAsc();
    List<ParkingSlot> findByStatusAndTypeOrderByBlockAscSlotNumberAsc(SlotStatus status, SlotType type);
    List<ParkingSlot> findByBlockOrderBySlotNumberAsc(String block);
    boolean existsByBlockIgnoreCaseAndSlotNumber(String block, String slotNumber);
    java.util.Optional<ParkingSlot> findByBlockIgnoreCaseAndSlotNumber(String block, String slotNumber);

    @Query("SELECT s FROM ParkingSlot s WHERE s.status = 'AVAILABLE' ORDER BY s.block, s.slotNumber")
    List<ParkingSlot> findAvailable();

    @Query("SELECT COUNT(s) FROM ParkingSlot s WHERE s.status = :status")
    long countByStatus(SlotStatus status);
}
