package com.myaangan.repository;

import com.myaangan.entity.Delivery;
import com.myaangan.enums.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    // Guard: today's deliveries logged by this guard
    List<Delivery> findByLoggedByEmailOrderByCreatedAtDesc(String email);

    // Guard: all deliveries today (for guard dashboard — all guards)
    List<Delivery> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime after);

    // Resident: all deliveries for this resident
    List<Delivery> findByResidentEmailOrderByCreatedAtDesc(String email);

    // Resident: pending (not yet collected/returned)
    List<Delivery> findByResidentEmailAndStatusInOrderByCreatedAtDesc(
        String email, List<DeliveryStatus> statuses);

    // Resident: count of pending deliveries (for badge)
    long countByResidentEmailAndStatusIn(String email, List<DeliveryStatus> statuses);

    // Admin: all deliveries, newest first
    List<Delivery> findAllByOrderByCreatedAtDesc();

    // Admin: filter by status
    List<Delivery> findByStatusOrderByCreatedAtDesc(DeliveryStatus status);

    // Flat number lookup (for guard — find by flat)
    List<Delivery> findByFlatNumberAndBlockOrderByCreatedAtDesc(
        String flatNumber, String block);

    // All deliveries by flat number (ignore block)
    List<Delivery> findByFlatNumberOrderByCreatedAtDesc(String flatNumber);
}
